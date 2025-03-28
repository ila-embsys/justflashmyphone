#!/usr/bin/make -f

EMMCDL_SRC = libs/emmcdl
LIBUSB_SRC = libs/libusb
FASTBOOTJS_SRC = libs/fastboot.js

FASTBOOTJS_PATCHES_SRC = patches/fastboot.js

LIBUSB_PREFIX=$(LIBUSB_SRC)/build

# https://github.com/emscripten-core/emscripten/pull/22095
# https://github.com/emscripten-core/emscripten/pull/18418

export CPPFLAGS =
export CFLAGS = -fPIC -pthread -fvisibility=default
export CXXFLAGS = $(CPPFLAGS) -fPIC -O1 -g3 -gsource-map -pthread -fvisibility=default
export LDFLAGS = -g3 -gsource-map

EMMCDL_CPPFLAGS = -I'$(CURDIR)/$(LIBUSB_PREFIX)/include' 
EMMCDL_CXXFLAGS = $(EMMCDL_CPPFLAGS)

# Flags are gathered here all around the Internet.
# Someone who understands what is happening here are needed
EMMCDL_LDFLAGS = -L'$(CURDIR)/$(LIBUSB_PREFIX)/lib' \
	-s WASM=1 \
	-s ENVIRONMENT=web,worker \
	-s EXPORT_ES6=1 \
	-s MODULARIZE=1 \
	-s EXPORTED_RUNTIME_METHODS=ccall,cwrap \
	-s ASSERTIONS=1 \
	-s ASYNCIFY=1 \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s EXPORTED_FUNCTIONS=_main \
	--emit-tsd emmcdl.d.ts \
	--bind

all: configure dist

# `yarn start` can be called after having built this target
build: src/emmcdl public/static/js/emmcdl.wasm

dist: src/emmcdl public/static/js/emmcdl.wasm $(FASTBOOTJS_SRC)
	yarn
	yarn build

clean: clean-dist clean-emmcdl clean-libusb
	
clean-dist:
	$(RM) -r dist

clean-emmcdl:
	$(RM) public/static/js/emmcdl.wasm
	$(RM) -r src/emmcdl
	$(RM) $(EMMCDL_SRC)/emmcdl.wasm
	$(RM) $(EMMCDL_SRC)/emmcdl.d.ts
	$(RM) $(EMMCDL_SRC)/emmcdl
	$(MAKE) -C $(EMMCDL_SRC) clean

clean-libusb:
	$(RM) -r $(LIBUSB_SRC)/build
	$(MAKE) -C $(LIBUSB_SRC) clean

public/static/js/emmcdl.wasm: $(EMMCDL_SRC)/emmcdl.wasm
	mkdir -p public/static/js
	cp $(EMMCDL_SRC)/emmcdl.wasm public/static/js
	cp $(EMMCDL_SRC)/emmcdl.wasm.map public/static/js || true

src/emmcdl: $(EMMCDL_SRC)/emmcdl.wasm
	mkdir -p $@
	cp $(EMMCDL_SRC)/emmcdl $@/emmcdl.js
	cp $(EMMCDL_SRC)/emmcdl.d.ts $@/emmcdl.d.ts

configure_emmcdl:
	cd $(EMMCDL_SRC) && autoreconf -iv
	cd $(EMMCDL_SRC) && emconfigure ./configure --host=wasm32-emscripten

configure_libusb:
	cd $(LIBUSB_SRC) && autoreconf -iv
	cd $(LIBUSB_SRC) && emconfigure ./configure --host=wasm32-emscripten --prefix=$(CURDIR)/$(LIBUSB_PREFIX)

configure: configure_libusb configure_emmcdl

$(EMMCDL_SRC)/emmcdl.wasm: $(LIBUSB_PREFIX)/lib/libusb-1.0.a
	cd $(EMMCDL_SRC) && \
		EMMCDL_CPPFLAGS="$(EMMCDL_CPPFLAGS)" \
		EMMCDL_CXXFLAGS="$(EMMCDL_CXXFLAGS)" \
		EMMCDL_LDFLAGS="$(EMMCDL_LDFLAGS)" \
			emmake make

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
