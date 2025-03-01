FROM ubuntu:24.10 as build

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        gpg \
        wget \
        git \
        python3 \
        xz-utils \
        gpg-agent \
        libusb-1.0-0-dev \
        make \
        autoconf \
        automake \
        libtool \
        node-typescript \
        sudo

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    install -dm 755 /etc/apt/keyrings && \
    \
    wget -qO - https://mise.jdx.dev/gpg-key.pub \
        | gpg --dearmor | tee /etc/apt/keyrings/mise-archive-keyring.gpg 1> /dev/null && \
    \
    echo "deb [signed-by=/etc/apt/keyrings/mise-archive-keyring.gpg arch=amd64] https://mise.jdx.dev/deb stable main" \
        | tee /etc/apt/sources.list.d/mise.list && \
    \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        mise

ARG USERNAME=ubuntu

RUN <<EOR
    echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME
    chmod 0440 /etc/sudoers.d/$USERNAME
EOR

USER $USERNAME

RUN --mount=type=cache,uid=1000,gid=1000,target=/home/$USERNAME/.cache/mise \
    --mount=type=bind,source=.mise.toml,target=.mise.toml,readonly,z \
    mise trust --yes .mise.toml && \
    mise install

# fix permissions
USER root
RUN chown $USERNAME:$USERNAME /home/$USERNAME/.cache && \
    chown $USERNAME:$USERNAME /home/$USERNAME/.cache/mise
USER $USERNAME

RUN mise exec emsdk -- emsdk install emscripten-1.38.31

RUN echo 'eval "$(mise activate bash)"' >> ~/.bashrc && \
    echo "source '/home/$USERNAME/.local/share/mise/installs/emsdk/latest/emsdk_env.sh'" >> $HOME/.bash_profile

ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8
