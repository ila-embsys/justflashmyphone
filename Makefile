#!/usr/bin/make -f

EMMCDL_SRC = libs/emmcdl
LIBUSB_SRC = libs/libusb
MKBOOTIMG_SRC = libs/mkbootimg
FASTBOOTJS_SRC = libs/fastboot.js

FASTBOOTJS_PATCHES_SRC = patches/fastboot.js

LIBUSB_PREFIX=$(LIBUSB_SRC)/build

EMMCDL_BUILD_DIR = src/emmcdl

MKBOOTIMG_INSTALL_DIR = src/mkbootimg
UNPACKBOOTIMG_INSTALL_DIR = src/unpackbootimg

# https://github.com/emscripten-core/emscripten/pull/22095
# https://github.com/emscripten-core/emscripten/pull/18418

export CPPFLAGS =
export CFLAGS = -fPIC -pthread
export CXXFLAGS = $(CPPFLAGS) -fPIC -pthread
export LDFLAGS =

EMMCDL_CPPFLAGS = -I'$(CURDIR)/$(LIBUSB_PREFIX)/include' 
EMMCDL_CXXFLAGS = $(EMMCDL_CPPFLAGS) -gsource-map

MKBOOTIMG_CFLAGS = -gsource-map
UNPACKBOOTIMG_CFLAGS = -gsource-map

# Flags are gathered here all around the Internet.
# Someone who understands what is happening here are needed

COMMON_WASM_LDFLAGS = \
	-s WASM=1 \
	-s EXPORT_ES6=1 \
	-s MODULARIZE=1 \
	-s EXPORTED_RUNTIME_METHODS=ccall,cwrap \
	-s ASSERTIONS=1 \
	-s ASYNCIFY=1 \
	-s ASYNCIFY_STACK_SIZE=8192 \
	-s EXPORTED_FUNCTIONS=_main \
	-s EXIT_RUNTIME=1 \
	--bind

EMMCDL_LDFLAGS = -L'$(CURDIR)/$(LIBUSB_PREFIX)/lib' \
	$(COMMON_WASM_LDFLAGS) \
	--emit-tsd emmcdl.d.ts

MKBOOTIMG_LDFLAGS = \
	$(COMMON_WASM_LDFLAGS) \
	-s EXPORTED_RUNTIME_METHODS=FS \
	-s EXIT_RUNTIME=1 \
	--emit-tsd mkbootimg.d.ts
	
UNPACKBOOTIMG_LDFLAGS = \
	$(COMMON_WASM_LDFLAGS) \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s EXPORTED_RUNTIME_METHODS=FS \
	-s EXIT_RUNTIME=1 \
	--emit-tsd unpackbootimg.d.ts

all: configure dist

# `yarn start` can be called after having built this target
build: \
	$(EMMCDL_BUILD_DIR)/emmcdl.wasm \
	$(MKBOOTIMG_INSTALL_DIR)/mkbootimg.wasm \
	$(UNPACKBOOTIMG_INSTALL_DIR)/unpackbootimg.wasm

dist: build $(FASTBOOTJS_SRC)
	yarn
	yarn build

clean: clean-dist clean-emmcdl clean-libusb clean-mkbootimg
	
clean-dist:
	$(RM) -r dist

clean-emmcdl:
	$(MAKE) -C $(EMMCDL_BUILD_DIR) clean
	$(RM) $(EMMCDL_BUILD_DIR)/emmcdl.wasm
	$(RM) $(EMMCDL_BUILD_DIR)/emmcdl.wasm.map
	$(RM) $(EMMCDL_BUILD_DIR)/emmcdl.d.ts

clean-libusb:
	$(RM) -r $(LIBUSB_SRC)/build
	$(MAKE) -C $(LIBUSB_SRC) clean
	$(RM) $(EMMCDL_BUILD_DIR)/emmcdl.d.ts

clean-mkbootimg:
	$(MAKE) -C $(MKBOOTIMG_SRC) clean
	$(RM) $(MKBOOTIMG_SRC)/mkbootimg.wasm
	$(RM) $(MKBOOTIMG_SRC)/mkbootimg.wasm.map
	$(RM) $(MKBOOTIMG_SRC)/mkbootimg.d.ts
	$(RM) $(MKBOOTIMG_INSTALL_DIR)/mkbootimg
	$(RM) $(MKBOOTIMG_INSTALL_DIR)/mkbootimg.wasm
	$(RM) $(MKBOOTIMG_INSTALL_DIR)/mkbootimg.wasm.map
	$(RM) $(MKBOOTIMG_INSTALL_DIR)/mkbootimg.d.ts

clean-unpackbootimg:
	$(MAKE) -C $(MKBOOTIMG_SRC) clean
	$(RM) $(MKBOOTIMG_SRC)/unpackbootimg.wasm
	$(RM) $(MKBOOTIMG_SRC)/unpackbootimg.wasm.map
	$(RM) $(MKBOOTIMG_SRC)/unpackbootimg.d.ts
	$(RM) $(UNPACKBOOTIMG_INSTALL_DIR)/unpackbootimg
	$(RM) $(UNPACKBOOTIMG_INSTALL_DIR)/unpackbootimg.wasm
	$(RM) $(UNPACKBOOTIMG_INSTALL_DIR)/unpackbootimg.wasm.map
	$(RM) $(UNPACKBOOTIMG_INSTALL_DIR)/unpackbootimg.d.ts

$(EMMCDL_BUILD_DIR)/emmcdl.wasm: $(LIBUSB_PREFIX)/lib/libusb-1.0.a
	EMMCDL_CPPFLAGS="$(EMMCDL_CPPFLAGS)" \
	EMMCDL_CXXFLAGS="$(EMMCDL_CXXFLAGS)" \
	EMMCDL_LDFLAGS="$(EMMCDL_LDFLAGS)" \
		emmake make -C $(EMMCDL_BUILD_DIR)

# $(MKBOOTIMG_SRC)/mkbootimg.wasm.map
$(MKBOOTIMG_INSTALL_DIR)/mkbootimg.wasm: \
	$(MKBOOTIMG_SRC)/mkbootimg \
	$(MKBOOTIMG_SRC)/mkbootimg.wasm \
	$(MKBOOTIMG_SRC)/mkbootimg.d.ts

	cp $^ $(MKBOOTIMG_INSTALL_DIR)

# $(MKBOOTIMG_SRC)/unpackbootimg.wasm.map
$(UNPACKBOOTIMG_INSTALL_DIR)/unpackbootimg.wasm: \
	$(MKBOOTIMG_SRC)/unpackbootimg \
	$(MKBOOTIMG_SRC)/unpackbootimg.wasm \
	$(MKBOOTIMG_SRC)/unpackbootimg.d.ts

	cp $^ $(UNPACKBOOTIMG_INSTALL_DIR)

$(EMMCDL_BUILD_DIR):
	mkdir -p $@

$(MKBOOTIMG_INSTALL_DIR):
	mkdir -p $@

$(UNPACKBOOTIMG_INSTALL_DIR):
	mkdir -p $@

configure_emmcdl: $(EMMCDL_BUILD_DIR)
	cd $(EMMCDL_BUILD_DIR) && autoreconf -iv $(CURDIR)/$(EMMCDL_SRC)
	cd $(EMMCDL_BUILD_DIR) && emconfigure $(CURDIR)/$(EMMCDL_SRC)/configure --host=wasm32-emscripten

configure_libusb:
	cd $(LIBUSB_SRC) && autoreconf -iv
	cd $(LIBUSB_SRC) && emconfigure ./configure --host=wasm32-emscripten --prefix=$(CURDIR)/$(LIBUSB_PREFIX)

configure_mkbootimg: $(MKBOOTIMG_INSTALL_DIR)

configure_unpackbootimg: $(UNPACKBOOTIMG_INSTALL_DIR)

configure: \
	configure_libusb \
	configure_emmcdl \
	configure_mkbootimg \
	configure_unpackbootimg

$(LIBUSB_PREFIX)/lib/libusb-1.0.a:
	cd $(LIBUSB_SRC) && \
		emmake make install

$(MKBOOTIMG_SRC)/mkbootimg \
$(MKBOOTIMG_SRC)/mkbootimg.wasm \
$(MKBOOTIMG_SRC)/mkbootimg.d.ts \
$(MKBOOTIMG_SRC)/mkbootimg.wasm.map \
: \
configure_mkbootimg
	cd $(MKBOOTIMG_SRC) && \
	CFLAGS="$(MKBOOTIMG_CFLAGS)" \
	LDFLAGS="$(MKBOOTIMG_LDFLAGS)" \
		emmake make -e CROSS_COMPILE="" AR="$(AR) -q" mkbootimg

$(MKBOOTIMG_SRC)/unpackbootimg \
$(MKBOOTIMG_SRC)/unpackbootimg.wasm \
$(MKBOOTIMG_SRC)/unpackbootimg.d.ts \
$(MKBOOTIMG_SRC)/unpackbootimg.wasm.map \
: \
configure_unpackbootimg
	cd $(MKBOOTIMG_SRC) && \
	CFLAGS="$(UNPACKBOOTIMG_CFLAGS)" \
	LDFLAGS="$(UNPACKBOOTIMG_LDFLAGS)" \
		emmake make -e CROSS_COMPILE="" AR="$(AR) -q" unpackbootimg

$(FASTBOOTJS_SRC):
	git apply --quiet --directory="$@" $(FASTBOOTJS_PATCHES_SRC)/* || true
	cd "$@" && yarn --mode=update-lockfile
	cd "$@" && yarn install
	cd "$@" && yarn build

.PHONY: all \
	clean \
	$(FASTBOOTJS_SRC) \
	configure_emmcdl \
	configure_libusb \
	configure build \
	configure_mkbootimg \
	configure_unpackbootimg \
	clean-dist \
	clean-emmcdl \
	clean-libusb \
	clean-mkbootimg \
	clean-unpackbootimg
