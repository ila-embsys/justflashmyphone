const demoVars = `parallel-download-flash:yes
hw-revision:20001
unlocked:yes
off-mode-charge:1
charger-screen-enabled:1
battery-soc-ok:yes
battery-voltage:4135
version-baseband:
version-bootloader:
erase-block-size: 0x1000
logical-block-size: 0x1000
variant:SM8 UFS
partition-type:mdm1m9kefsc:raw
partition-size:mdm1m9kefsc: 0x1000
partition-type:mdm1m9kefs2:raw
partition-size:mdm1m9kefs2: 0x200000
partition-type:mdm1m9kefs1:raw
partition-size:mdm1m9kefs1: 0x200000
partition-type:mdm1m9kefs3:raw
partition-size:mdm1m9kefs3: 0x200000
partition-type:fsc:raw
partition-size:fsc: 0x20000
partition-type:fsg:raw
partition-size:fsg: 0x200000
partition-type:modemst2:raw
partition-size:modemst2: 0x200000
partition-type:modemst1:raw
partition-size:modemst1: 0x200000
partition-type:ALIGN_TO_128K_2:raw
partition-size:ALIGN_TO_128K_2: 0x1A000
partition-type:vm-data:raw
partition-size:vm-data: 0x400000
partition-type:vm-keystore:raw
partition-size:vm-keystore: 0x20000
partition-type:secdata:raw
partition-size:secdata: 0x7000
partition-type:uefivarstore:raw
partition-size:uefivarstore: 0x80000
partition-type:storsec:raw
partition-size:storsec: 0x20000
partition-type:logdump:raw
partition-size:logdump: 0x4000000
partition-type:logfs:raw
partition-size:logfs: 0x800000
partition-type:limits-cdsp:raw
partition-size:limits-cdsp: 0x1000
partition-type:limits:raw
partition-size:limits: 0x1000
partition-type:msadp:raw
partition-size:msadp: 0x40000
partition-type:apdp:raw
partition-size:apdp: 0x40000
partition-type:dip:raw
partition-size:dip: 0x100000
partition-type:devinfo:raw
partition-size:devinfo: 0x1000
partition-type:imagefv_b:raw
partition-size:imagefv_b: 0x200000
partition-type:featenabler_b:raw
partition-size:featenabler_b: 0x20000
partition-type:vm-linux_b:raw
partition-size:vm-linux_b: 0x2000000
partition-type:multiimgqti_b:raw
partition-size:multiimgqti_b: 0x8000
partition-type:multiimgoem_b:raw
partition-size:multiimgoem_b: 0x8000
partition-type:uefisecapp_b:raw
partition-size:uefisecapp_b: 0x200000
partition-type:dtbo_b:raw
partition-size:dtbo_b: 0x1800000
partition-type:vbmeta_b:raw
partition-size:vbmeta_b: 0x10000
partition-type:qupfw_b:raw
partition-size:qupfw_b: 0x14000
partition-type:devcfg_b:raw
partition-size:devcfg_b: 0x20000
partition-type:cmnlib64_b:raw
partition-size:cmnlib64_b: 0x80000
partition-type:cmnlib_b:raw
partition-size:cmnlib_b: 0x80000
partition-type:boot_b:raw
partition-size:boot_b: 0x6000000
partition-type:keymaster_b:raw
partition-size:keymaster_b: 0x80000
partition-type:dsp_b:raw
partition-size:dsp_b: 0x4000000
partition-type:abl_b:raw
partition-size:abl_b: 0x100000
partition-type:mdtp_b:raw
partition-size:mdtp_b: 0x2000000
partition-type:mdtpsecapp_b:raw
partition-size:mdtpsecapp_b: 0x400000
partition-type:bluetooth_b:raw
partition-size:bluetooth_b: 0x100000
partition-type:modem_b:raw
partition-size:modem_b: 0x18B00000
partition-type:hyp_b:raw
partition-size:hyp_b: 0x800000
partition-type:tz_b:raw
partition-size:tz_b: 0x400000
partition-type:aop_b:raw
partition-size:aop_b: 0x80000
partition-type:imagefv_a:raw
partition-size:imagefv_a: 0x200000
partition-type:featenabler_a:raw
partition-size:featenabler_a: 0x20000
partition-type:vm-linux_a:raw
partition-size:vm-linux_a: 0x2000000
partition-type:multiimgqti_a:raw
partition-size:multiimgqti_a: 0x8000
partition-type:multiimgoem_a:raw
partition-size:multiimgoem_a: 0x8000
partition-type:uefisecapp_a:raw
partition-size:uefisecapp_a: 0x200000
partition-type:dtbo_a:raw
partition-size:dtbo_a: 0x1800000
partition-type:vbmeta_a:raw
partition-size:vbmeta_a: 0x10000
partition-type:qupfw_a:raw
partition-size:qupfw_a: 0x14000
partition-type:devcfg_a:raw
partition-size:devcfg_a: 0x20000
partition-type:cmnlib64_a:raw
partition-size:cmnlib64_a: 0x80000
partition-type:cmnlib_a:raw
partition-size:cmnlib_a: 0x80000
partition-type:boot_a:raw
partition-size:boot_a: 0x6000000
partition-type:keymaster_a:raw
partition-size:keymaster_a: 0x80000
partition-type:dsp_a:raw
partition-size:dsp_a: 0x4000000
partition-type:abl_a:raw
partition-size:abl_a: 0x100000
partition-type:mdtp_a:raw
partition-size:mdtp_a: 0x2000000
partition-type:mdtpsecapp_a:raw
partition-size:mdtpsecapp_a: 0x400000
partition-type:bluetooth_a:raw
partition-size:bluetooth_a: 0x100000
partition-type:modem_a:raw
partition-size:modem_a: 0x18B00000
partition-type:hyp_a:raw
partition-size:hyp_a: 0x800000
partition-type:tz_a:raw
partition-size:tz_a: 0x400000
partition-type:aop_a:raw
partition-size:aop_a: 0x80000
partition-type:mdmddr:raw
partition-size:mdmddr: 0x100000
partition-type:ddr:raw
partition-size:ddr: 0x200000
partition-type:cdt:raw
partition-size:cdt: 0x20000
partition-type:ALIGN_TO_128K_1:raw
partition-size:ALIGN_TO_128K_1: 0x1A000
partition-type:xbl_config_b:raw
partition-size:xbl_config_b: 0x20000
partition-type:xbl_b:raw
partition-size:xbl_b: 0x380000
partition-type:xbl_config_a:raw
partition-size:xbl_config_a: 0x20000
partition-type:xbl_a:raw
partition-size:xbl_a: 0x380000
partition-type:userdata:f2fs
partition-size:userdata: 0x37E8DD3000
partition-type:rawdump:raw
partition-size:rawdump: 0x8000000
partition-type:vm-system_b:raw
partition-size:vm-system_b: 0x8000000
partition-type:vm-system_a:raw
partition-size:vm-system_a: 0x8000000
partition-type:metadata:ext4
partition-size:metadata: 0x1000000
partition-type:vbmeta_system_b:raw
partition-size:vbmeta_system_b: 0x10000
partition-type:vbmeta_system_a:raw
partition-size:vbmeta_system_a: 0x10000
partition-type:recovery_b:raw
partition-size:recovery_b: 0x6400000
partition-type:recovery_a:raw
partition-size:recovery_a: 0x6400000
partition-type:super:raw
partition-size:super: 0x300000000
partition-type:frp:raw
partition-size:frp: 0x80000
partition-type:keystore:raw
partition-size:keystore: 0x80000
partition-type:misc:raw
partition-size:misc: 0x100000
partition-type:persist:raw
partition-size:persist: 0x2000000
partition-type:ssd:raw
partition-size:ssd: 0x2000
has-slot:modem:yes
has-slot:system:no
current-slot:a
has-slot:boot:yes
slot-retry-count:b:0
slot-unbootable:b:yes
slot-successful:b:no
slot-retry-count:a:7
slot-unbootable:a:no
slot-successful:a:yes
slot-count:2
secure:yes
serialno:12345678
product:spinel
snapshot-update-status:none
is-userspace:no
max-download-size:805306368
kernel:uefi
`

export default demoVars;
