#!/usr/bin/make -f

EMMCDL_SRC = libs/emmcdl
LIBUSB_SRC = libs/libusb
FASTBOOTJS_SRC = libs/fastboot.js

FASTBOOTJS_PATCHES_SRC = patches/fastboot.js

LIBUSB_PREFIX=$(LIBUSB_SRC)/build

EMMCDL_BUILD_DIR = src/emmcdl

# https://github.com/emscripten-core/emscripten/pull/22095
# https://github.com/emscripten-core/emscripten/pull/18418

export CPPFLAGS =
export CFLAGS = -fPIC -pthread
export CXXFLAGS = $(CPPFLAGS) -fPIC -pthread
export LDFLAGS =

EMMCDL_CPPFLAGS = -I'$(CURDIR)/$(LIBUSB_PREFIX)/include' 
EMMCDL_CXXFLAGS = $(EMMCDL_CPPFLAGS) -gsource-map

# Flags are gathered here all around the Internet.
# Someone who understands what is happening here are needed
EMMCDL_LDFLAGS = -L'$(CURDIR)/$(LIBUSB_PREFIX)/lib' \
	-s WASM=1 \
	-s EXPORT_ES6=1 \
	-s MODULARIZE=1 \
	-s EXPORTED_RUNTIME_METHODS=ccall,cwrap \
	-s ASSERTIONS=1 \
	-s ASYNCIFY=1 \
	-s ASYNCIFY_STACK_SIZE=8192 \
	-s EXPORTED_FUNCTIONS=_main \
	--emit-tsd emmcdl.d.ts \
	--bind

all: configure dist

# `yarn start` can be called after having built this target
build: $(EMMCDL_BUILD_DIR)/emmcdl.wasm

dist: build $(FASTBOOTJS_SRC)
	yarn
	yarn build

clean: clean-dist clean-emmcdl clean-libusb
	
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

$(EMMCDL_BUILD_DIR)/emmcdl.wasm: $(LIBUSB_PREFIX)/lib/libusb-1.0.a
	EMMCDL_CPPFLAGS="$(EMMCDL_CPPFLAGS)" \
	EMMCDL_CXXFLAGS="$(EMMCDL_CXXFLAGS)" \
	EMMCDL_LDFLAGS="$(EMMCDL_LDFLAGS)" \
		emmake make -C $(EMMCDL_BUILD_DIR)

$(EMMCDL_BUILD_DIR):
	mkdir -p $@

configure_emmcdl: $(EMMCDL_BUILD_DIR)
	cd $(EMMCDL_BUILD_DIR) && autoreconf -iv $(CURDIR)/$(EMMCDL_SRC)
	cd $(EMMCDL_BUILD_DIR) && emconfigure $(CURDIR)/$(EMMCDL_SRC)/configure --host=wasm32-emscripten

configure_libusb:
	cd $(LIBUSB_SRC) && autoreconf -iv
	cd $(LIBUSB_SRC) && emconfigure ./configure --host=wasm32-emscripten --prefix=$(CURDIR)/$(LIBUSB_PREFIX)

configure: configure_libusb configure_emmcdl


$(LIBUSB_PREFIX)/lib/libusb-1.0.a:
	cd $(LIBUSB_SRC) && \
		emmake make install

$(FASTBOOTJS_SRC):
	git apply --quiet --directory="$@" $(FASTBOOTJS_PATCHES_SRC)/* || true
	cd "$@" && yarn
	cd "$@" && yarn build

.PHONY: all \
	clean \
	$(FASTBOOTJS_SRC) \
	configure_emmcdl \
	configure_libusb \
	configure build \
	clean-dist \
	clean-emmcdl \
	clean-libusb
