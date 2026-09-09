/* ============================================================
   ОАД — интерфейс. Все локально, ни одного сетевого вызова,
   кроме отправки формы заявки (адрес задается в CONFIG).
   ============================================================ */

const CONFIG = {
  // Куда отправлять заявку на «выписку». Пусто — форма только показывает
  // подтверждение и никуда не ходит (режим прототипа).
  leadEndpoint: '',
  // Ссылка-приглашение в клинику после отправки формы.
  clinicUrl: 'https://katerinazaber.github.io/itman/klinika-b/',
  maxRows: 50000
};

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plural = (n, a, b, c) => { const m = n % 100, k = n % 10; return m > 10 && m < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c; };

let STATE = { rows: null, cols: null, result: null, recon: null };

/* ---------- образцы ----------
   Пять выгрузок, по одной на каждый диагноз. Каждая строка в них —
   подлинная запись из реальной инвентаризации; ни одно наименование,
   версия или издатель не выдуманы. Подставляются на сборке. */
const DEMOS = [{"band": "Практически здоров", "tone": "#0a8f4d", "index": 91, "rows": 205, "csv": "Наименование ПО;Версия;Издатель\n3Dconnexion 3DxLCDSPPRO;1.5.1.14750;3Dconnexion\nIntel(R) Rapid Storage Technology Management Service;18.7.7.1013;Intel Corporation\nmpress;1.27;MATCODE Software\nMicrosoft® Windows® Operating System;10.0.19041.2180;Microsoft Corporation\nlibdrm.x86_64;2.4.103-1.el8;@rhel-8-for-x86_64-appstream-rpms\nSystem software for Windows 2.8.7;2.8.7;CUTA\nfly-admin-driver;;Medvedev Dmitry <dmedvedev@astralinux.ru>\nSQL Server 2012 Integration Services;11.0;Microsoft Corporation\nFlash OS images to SD cards and USB drives, safely and easily.;2.1.2;Balena Ltd. <hello@balena.io>\nHP LJ100 M175 HP Scan;1.0;Hewlett-Packard Co.\nAutodesk Installer;1.30.0.1;Autodesk, Inc.\nKaspersky Embedded Systems Security for Windows;3.4.0.36;AO Kaspersky Lab\nNVIDIA-SMI 461.09;8.17.14.6109;NVIDIA Corporation\nFtpExe;1.0.7271.19279;AVI\ndataservices.embeddedhelp-4.0-en-64;14.2.13.2467;SAP BusinessObjects\n7-Zip SFX;1.6.0.2712;Oleg N. Scherbakov\nKaspersky Embedded Systems Security;1.1.0.104;AO Kaspersky Lab\nLumension Endpoint Security Client;4.6;Lumension\nthink-cell;14.0;think-cell Operations GmbH\nAdobe Acrobat;7.0.0.0;Adobe Systems Incorporated\nPDF24 Creator;9.2.0;Geek Software GmbH\nAdobe Acrobat;2.1;Adobe Systems Incorporated\nNVIDIA Install Application;2.265.36.0;NVIDIA Corporation\nthink-cell;11.0.33.8;think-cell Operations GmbH\nAutodesk Desktop Delivery Application;1.34.0.1;Autodesk, Inc.\nIntel(R) PRO Adapter;4.02;Intel Corporation\nshell_executor.exe;3.5.5030 (vvrao);Intel Corporation\nhppSendFaxM1522;003.000;Название организации\nSendMiniDmp.exe;17.0.5.0;Autodesk, Inc.\nTFlex CAD 12;1.0.0.1;Top Systems, Ltd.\nMicrosoft Project профессиональный 2013;15.0;Microsoft Corporation\nTeamViewer QS;15.11.6.0;TeamViewer\nTeamViewer;15.1.3937.0;TeamViewer Germany GmbH\nMouseCapture;1.0.0.0;Microsoft\n1C Предприятие 7.7;77.25;\n360 Extreme Browser;13.0.3.0;360 Extreme Browser\nQEMU guest agent;102.7;RedHat\nJava Platform SE Auto Updater;2.8.162.12;Oracle Corporation\nMSS;23.1.1.85;Keysystems\nHP Recovery Image & Software Download Tool (ThinUpdate) 64-b;2.2.9;Hewlett-Packard Company\n1C:Enterprise 8.0;8.0.13;1C\nCorel Graphics - Windows Shell Extension 32 Bit Keys;19.0;Corel Corporation\nthink-cell;11.0.32.426;think-cell Operations GmbH\nYandex;1.6.2.855;YANDEX LLC\nTeamViewer;15.21.6.0;TeamViewer Germany GmbH\nADLM;1.3;Autodesk, Inc.\nАДЕПТ: Проект;12.5.0.21;АДЕПТ\nIsoBuster;3.0.0;Smart Projects\nGoogle Chrome;137.0;Google LLC\nAdobe Acrobat;22.1.20142.0;Adobe Systems Incorporated\nAtom Installer;9.0.1.11;The Atom Authors\nNVIDIA-SMI 516.94;8.17.15.1694;NVIDIA Corporation\nVisual Studio Code;1.100.0;Microsoft Corporation\nWindows Media Component Setup Application;7.01.00.3055;Корпорация Майкрософт (Microsoft Corp.)\nsolvo-scheduler-api;2.0.5;Solvo Ltd.\nRealtek PCIe Media Card Reader Drivers;10.0.22621.21357;HP Inc.\nthink-cell;14.0.38.494;think-cell Operations GmbH\nconnectivity.connectionserver.drivers.db2.odbc.config-4.0-ru-nu;14.2.4.2410;SAP BusinessObjects\n1C:Предприятие 8.2 (x86-64) (8.2.19.130);8.2;1C\nMicrosoft SQL Server 2014;12.2.5000.0;Microsoft Corporation\nViewer;3.5.5401.27093;SpaceTeamLab, Ltd.\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nInstaller;4.4.26.0;АО «СИСОФТ РАЗРАБОТКА»\nPostman;9.9.3;Postman\nzabbix-get;6.0.40;(none)\nYandexTelemost;1.0.35.1174;Yandex\nnanoCAD BIM Вентиляция;22.0.5600.5600;Nanosoft\novirt-engine-setup-plugin-websocket-proxy;4.5.4;\"\"\"Orionsoft\"\"\"\nAdobe Acrobat;15.7.20033.133275;Adobe Systems Incorporated\nMicrosoft SQL Server 2016;13.2.5888.11;Microsoft Corporation\nPostman;11.27.3;Postman\nGPU Settings DBInstall Application;10.18.13.5887;NVIDIA Corporation\nДиспетчер Realtek HD;1.0.0.301;Realtek Semiconductor\nChromium Installer;141.0.7379.0;The Chromium Authors\nlibbluray.x86_64 * @anaconda/7.4 * 0.2.3-5.el7;;\nplatform.client.java.app.cmc.webpath_bundles-4.0-ru-nu;14.2;SAP BusinessObjects\nJava(TM) Platform SE 20.0.1;20.0.1.0;Oracle Corporation\nAdobe Acrobat;22.3.20282.0;Adobe Systems Incorporated\nGoogle Chrome Installer;98.0.4758.82;Google LLC\nKasten K10 Plug-In UI extension for Veeam Backup & Replication;12.0.1.4;Veeam Software Group GmbH\nthink-cell;7.0.24.170;think-cell Software GmbH\nKaspersky Embedded Systems Security for Windows;3.3.0.87;AO Kaspersky Lab\nLogTransport Application;8.1.0.19.48545;Adobe Systems Incorporated\nrepoaccess.ctplugin.java-4.0-core-nu;14.3.1.3910;SAP BusinessObjects\ntp.gzip-1.2.3-core-32;14.2.4.2649;SAP BusinessObjects\nIntel(R) Common User Interface;6.15.100.7859;Intel Corporation\n1C Предприятие 7.7;77.27;\npython3-libvirt;4.5.0;Red Hat, Inc.\ntesthost.arm64;17.14.0-preview-25117-01;Microsoft Corporation\nKaspersky Embedded Systems Security 2.0;2.0.0.388;AO Kaspersky Lab\nGPL Ghostscript;9.25;Artifex Software Inc.\n1С:Предприятие 8 (x86-64) (8.3.21.1607);8.3.21.1607;1С-Софт\nDSController;1.00.0082;ND\nEFA;7.4.2.66;Broadcom\nBrowserCore;64.0.3282.24;TeamDev Ltd\nFoxit ConnectedPDF Popup Notice Windows.;9.7.0.29430;Foxit Software Inc.\nIntel SGX Device and Software -Package 1.5.11.3;2.7.101.2;Lenovo Group Limited\ncredo_transcor Credo Framework Application;2024.1.1.254;КРЕДО-ДИАЛОГ\nArcGIS Desktop Background Geoprocessing 10.8.1;10.8.1.14362;Esri\nMicrosoft PowerBI Desktop (x64);2.118.621.0;Microsoft Corporation\nMKVToolNix;44.0.0;Moritz Bunkus\nLEPToastLnc;10.0.154.0;Lenovo Group Limited\ntp.json.java.boe-1.0_sap.1-core-nu;14.2.4.2649;SAP BusinessObjects\nСписок ЭД-деклараций;1.02.0063;CTM\nJazz;24.9.2028.0;SaluteJazz\nvlc-plugin-video-output:amd64;3.0.21-0astra2+b2;Debian Multimedia Maintainers <debian-multimedia@lists.debian.org>\n1C:Предприятие 8.2 (8.2.19.106);8.2;1C\nDeviceInstaller;4.300.1.500;Lantronix\ngrafana-mysql;6.3.6;Red Hat, Inc.\nТИМ КРЕДО ТРАНСФОРМ;24.21;компания «Кредо-Диалог»\ngspell.x86_64;1.8.1-1.el8;@rhel-8-for-x86_64-appstream-rpms\nrubygem-bcrypt;3.1.20;Red Hat, Inc.\nVMware Player;12.5;VMware, Inc.\nАРМ Кабинет заявки УЦ АО «НИИАС»;2.5;АО «НИИАС»\nNI Portable Configuration for 64 Bit Windows 19.5.0;19.50;National Instruments\npcp-pmda-lustrecomm;5.1.1;Red Hat, Inc.\nQGIS 3.10.12 'A Coruсa';3.10;QGIS Development Team\nFileAccessErrorView;1.22;NirSoft\nplatform.services.java.publishingservice-4.0-core-nu;14.3.4.5181;SAP BusinessObjects\nAshampoo Burning Studio 10 Portable;0.0.0.0;PortableAppZ.blogspot.com\nPokerStars;3.0.0.658;PokerStars\nwebkit2gtk3-jsc;2.24.4;Red Hat, Inc.\nThunderbolt(TM) Software;17.4.78.15;Intel Corporation\nAdobeLogCollectorTool;5.0.0.61;Adobe Systems Incorporated\nmariadb-backup;10.3.35;Red Hat, Inc.\nКонфигуратор КСОДУ;1.2.3.16;Sum of the technologies\nXnView;2.12;XnView, http://www.xnview.com\nrepoaccess.repositoryproxyinterface.java-4.0-core-nu;14.0;SAP BusinessObjects\nMicrosoft Edge;1.3.185.27;Microsoft Corporation\nrandpktdump;4.0.10;The Wireshark developer community\nshared.tp.aurora.apache.derby-4.0-core-nu;14.3.4.5181;SAP BusinessObjects\nMmdbresolve;4.2.0;The Wireshark developer community\nSysinternals Du;1.5;Sysinternals - www.sysinternals.com\nDesktops;2.0;Sysinternals - www.sysinternals.com\nIntelAudioService;01.00.748.00;Intel\nMicrosoft(R) Windows NT(R) Operating System;4.71.0728.0;Microsoft Corporation\nExpressMeeting;3.1;Unlimited Technology LLC\nthink-cell;7.0.24.150;think-cell Software GmbH\n1С:Предприятие 8 (8.3.24.1548);8.3.24.1548;1С-Софт\nСБИС Плагин;23.7148;Tensor Company Ltd\nAggreGate 6.33.01;6.33.01;Tibbo Systems\nfilesystem;15.0;SUSE LLC <https://www.suse.com/>\nthink-cell;1.17.980.0;think-cell Software GmbH\npciutils-libs.x86_64;3.5.1-3.el7;@rhel-7-server-rpms\nDrive Snapshot for WindowsNT;1.44.17289;Tom Ehlert Software\nAutoPlay Menu Builder;8.0;\"ООО \"\"ВЕГА ИНСТРУМЕНТС\"\"\"\nMicrosoft (R) Visual Studio;6.00.9437;Microsoft Corporation\nAdobe Acrobat;22.3.20310.0;Adobe Systems Incorporated\nsle-module-desktop-applications-release;15.7;SUSE LLC <https://www.suse.com/>\nthink-cell;14.0.38.522;think-cell Operations GmbH\nExeInfo;1.01;NirSoft\nopenjdk-11-jdk-headless;;OpenJDK Team <openjdk-11@packages.debian.org>\nAdobe Dynamic Link Manager 14;14.0.0;Adobe\nHP Install;6.9.0.24630;HP Inc.\nDIALux evo;3.2.0.0;DIAL GmbH\nAdobe Acrobat;7.0.5.2005092300;Adobe Systems Incorporated\nSAS.Planet;1.0.0.0;SAS Group\nxdg-menu;0.2;SUSE LLC <https://www.suse.com/>\n1C:Enterprise 8.0;8.0.16.2;1C\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nGeodeWPF;1.1.7168.6305;Golden Software, LLC\nLocBaml;1.0.0.0;Microsoft\nnanoCAD BIM Вентиляция x64;25.0.12926.12926;Nanosoft\nglow;2.1.1;charmbracelet\nK-Lite Codec Pack;17.6.8;KLCP\nrepoaccess.ctplugin.java.shared_classes-4.0-core-nu;14.0;SAP BusinessObjects\nrubygem-diffy;3.4.2;Red Hat, Inc.\n1С:Предприятие 8 (8.3.20.1674);8.3.20.1674;1С-Софт\nTeamViewer;15.21.8.0;TeamViewer Germany GmbH\nAdobe Reader and Acrobat Manager;1.5.5.0;Adobe Systems Incorporated\nQueue.Kiosk;1.0.0;Queue.Kiosk\nГРАНД-Смета, версия 2025.3;15.3.7;МГК ГРАНД\nTelegram Desktop;4.14.9;Telegram FZ-LLC\nXbox;12.80.210811001;Microsoft Corporation\nrubygem-locale;2.1.4;Red Hat, Inc.\nPostman;1.3;Alexey Popov (Ghost)\nnanoCAD BIM Вентиляция x64 24.1;24.1;Nanosoft Razrabotka\nInkscape Portable;0.92.4.0;PortableApps.com\ngcab;1.1;SUSE LLC <https://www.suse.com/>\nMicrosoft .NET Framework Cumulative Intellisense Pack for Visu;4.8.03761;Microsoft Corporation\nKontur.VNC;4.4.23.1914;PF SKB Kontur ZAO\nUnrealEngine3;1.0.4589.30310;Epic Games, Inc.\nMicrosoft Windows Desktop Targeting Pack - 8.0.10 (x64);64.40;Microsoft Corporation\nfly-admin-samba;1.5.13+ci4;Vladislav Mileshkin <support@rusbitech.ru>\nElectronika Security Manager;2024.1.1.305;Ltd Soft Division\nKaspersky Endpoint Security for Windows;11.15;\nHeroes of Might and Magic V (обновление 1.3);1.3;Nival Interactive\nNVIDIA Графический драйвер 466.27;466.27;NVIDIA Corporation\nAltiris Service Control Task Agent;6.0;Altiris Inc.\nInternet Explorer;11.00.14393.4046;Microsoft Corporation\nMicrosoft SQL Server;14.0.1016.246;Microsoft Corporation\nTeamViewer;15.73.5.0;TeamViewer Germany GmbH\nIGCC;1.100.5131.0;Intel Corporation\nTeamViewer;4.0;TeamViewer GmbH\nHP Simple Pass;5.1.0.175;Hewlett Packard\ngrub2.x86_64;@InstallMedia-BaseOS7.9;1:2.02-0.87.el7\nlibwrap0:amd64;7.6.q-30;Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\nWireshark Portable (64-bit);3.6.5.0;PortableApps.com\nSecurity Update for Microsoft Excel 2013 (KB5002384) 64-Bit Edition;;MicrosoftInstallDate    :\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\neltex-johnny * Victor Abarenov <victor.abarenov@eltex-co.ru> * 1.29-257;;\nTestHttp;1.0.0.0;\nMonkey's Audio;3.99;Matthew T. Ashland\nMicrosoft® Visual Studio®;16.0.28522.59;Microsoft Corporation\nPostman;11.83.0;Postman\n", "file": "01_Практически_здоров_v3.csv"}, {"band": "Легкая форма дублитоза", "tone": "#5a9216", "index": 79, "rows": 224, "csv": "Наименование ПО;Версия;Издатель\nМойОфис Почта;2.8;(с) ООО «НОВЫЕ ОБЛАЧНЫЕ ТЕХНОЛОГИИ», 2013–2024\nsle-module-desktop-applications-release;15.7;SUSE LLC <https://www.suse.com/>\n1С:Предприятие 8 (x86-64) (8.3.21.1607);8.3.21.1607;1С-Софт\nIntel(R) PRO Adapter;4.02;Intel Corporation\n1C:Enterprise 8.0;8.0.13;1C\nshell_executor.exe;3.5.5030 (vvrao);Intel Corporation\nMouseCapture;1.0.0.0;Microsoft\nAutoCAD;17.2.56.0;Autodesk, Inc\nDIALux evo;3.2.0.0;DIAL GmbH\nMicrosoft® Windows® Operating System;10.0.19041.2180;Microsoft Corporation\nAggreGate 6.33.01;6.33.01;Tibbo Systems\nLumension Endpoint Security Client;4.6;Lumension\nlibdjvulibre21:amd64;3.5.28-2+b1;Barak A. Pearlmutter <bap@debian.org>\nurw-base35-p052-fonts;20170801;CentOS\nPostman;1.3;Alexey Popov (Ghost)\nLinkRelevanceMonitor;1.5.0+4345dd0.4345dd0dab968c5af8209f4bed1830b4cc3c5f8c;ConsultantPlus\nRStudio;1,1,423,0;RStudio, Inc.\ndataservices.embeddedhelp-4.0-en-64;14.2.13.2467;SAP BusinessObjects\nHeroes of Might and Magic V (обновление 1.3);1.3;Nival Interactive\n1C:Enterprise 8.2 (8.2.19.130);8.2;1C\nfilesystem;15.0;SUSE LLC <https://www.suse.com/>\nMicrosoft SQL Server 2014;12.2.5000.0;Microsoft Corporation\nkbd;2.0.4-4;Console utilities maintainers <pkg-kbd-devel@lists.alioth.debian.org>\nAdobe Acrobat;22.3.20310.0;Adobe Systems Incorporated\nMicrosoft® Office;15.0.0169.500;Microsoft Corporation\nnanoCAD BIM Вентиляция;22.0.5600.5600;Nanosoft\nMicrosoft PowerBI Desktop (x64);2.118.621.0;Microsoft Corporation\nthink-cell;11.0.32.426;think-cell Operations GmbH\nplatform.client.java.app.cmc.webpath_bundles-4.0-ru-nu;14.2;SAP BusinessObjects\nchromium;138.0.7204.168;redsoft\nIntel(R) Common User Interface;6.15.100.7859;Intel Corporation\nrubygem-diffy;3.4.2;Red Hat, Inc.\nТИМ КРЕДО ТРАНСФОРМ;24.21;компания «Кредо-Диалог»\nExpressMeeting;3.1;Unlimited Technology LLC\nThunderbolt(TM) Software;17.4.78.15;Intel Corporation\nVMware Workstation;16.0.0;VMware, Inc.\nKaspersky Embedded Systems Security 2.0;2.0.0.388;AO Kaspersky Lab\nopenjdk-11-jdk-headless;;OpenJDK Team <openjdk-11@packages.debian.org>\nmozjs17.x86_64;@rhel-7-server-rpms;17.0.0-20.el7\nlibXxf86misc.x86_64;@anaconda/7.6;1.0.3-7.1.el7\n1C Предприятие 7.7;77.25;\nXnView;2.12;XnView, http://www.xnview.com\nArcGIS Desktop Background Geoprocessing 10.8.1;10.8.1.14362;Esri\nTeamViewer;15.73.5.0;TeamViewer Germany GmbH\ngrub2.x86_64;@InstallMedia-BaseOS7.9;1:2.02-0.87.el7\nAdobe LiveCycle Designer;11, 0, 8, 20180110, 1, 931507;Adobe Systems Incorporated\nlibwrap0:amd64;7.6.q-30;Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\nWindows® Internet Explorer;10.00.9200.16521;Microsoft Corporation\nrubygem-bcrypt;3.1.20;Red Hat, Inc.\nMKVToolNix;44.0.0;Moritz Bunkus\nfly-admin-samba;1.5.13+ci4;Vladislav Mileshkin <support@rusbitech.ru>\nIntel SGX Device and Software -Package 1.5.11.3;2.7.101.2;Lenovo Group Limited\nMSS;23.1.1.85;Keysystems\nVMware Workstation;16.2.3;VMware, Inc.\nNI Portable Configuration for 64 Bit Windows 19.5.0;19.50;National Instruments\nnode-validate-npm-package-name;3.0.0-1;Debian Javascript Maintainers <pkg-javascript-devel@lists.alioth.debian.org>\nVMware Workstation;16.2;VMware, Inc.\nnanoCAD Стройплощадка x64;22.0.3838.6048;ООО «Нанософт разработка»\nQEMU guest agent;102.7;RedHat\nAdobe Reader and Acrobat Manager;1.5.5.0;Adobe Systems Incorporated\nlibdrm.x86_64;2.4.103-1.el8;@rhel-8-for-x86_64-appstream-rpms\nJava(TM) Platform SE 20.0.1;20.0.1.0;Oracle Corporation\nTeamViewer;15.21.6.0;TeamViewer Germany GmbH\npciutils-libs.x86_64;3.5.1-3.el7;@rhel-7-server-rpms\njson-c.x86_64 * @rhel-8-for-x86_64-baseos-rpms * 0.13.1-0.4.el8;;\nfly-admin-driver;;Medvedev Dmitry <dmedvedev@astralinux.ru>\nthink-cell;1.17.980.0;think-cell Software GmbH\nPokerStars;3.0.0.658;PokerStars\nTeamViewer;15.21.8.0;TeamViewer Germany GmbH\nМойОфис Почта 2.8 (x64 ru);2.8;ООО «НОВЫЕ ОБЛАЧНЫЕ ТЕХНОЛОГИИ»\nAshampoo Burning Studio 10 Portable;0.0.0.0;PortableAppZ.blogspot.com\n3Dconnexion 3DxLCDSPPRO;1.5.1.14750;3Dconnexion\n1C:Enterprise 8.2;8.2.14.540;1C\nQGIS 3.10.12 'A Coruсa';3.10;QGIS Development Team\nthink-cell;14.0.38.494;think-cell Operations GmbH\nPostman;11.83.0;Postman\nGeodeWPF;1.1.7168.6305;Golden Software, LLC\nАДЕПТ: Проект;12.5.0.21;АДЕПТ\nIntelAudioService;01.00.748.00;Intel\nMicrosoft(R) Windows NT(R) Operating System;4.71.0728.0;Microsoft Corporation\nTeamViewer QS;15.11.6.0;TeamViewer\nСБИС Плагин;23.7148;Tensor Company Ltd\nKaspersky Embedded Systems Security;1.1.0.104;AO Kaspersky Lab\nGoogle Chrome Installer;98.0.4758.82;Google LLC\novirt-engine-setup-plugin-websocket-proxy;4.5.4;\"\"\"Orionsoft\"\"\"\n7-Zip SFX;1.6.0.2712;Oleg N. Scherbakov\nnodejs;18.20.1;RED SOFT\nAdobe Acrobat;25.1.20623.0;Adobe\niwl6000g2a-firmware.noarch;18.168.6.1-99.el8.1;@anaconda\nVMware Workstation;4.5.2.8848;VMware, Inc.\nUnrealEngine3;1.0.4589.30310;Epic Games, Inc.\nAdobe Acrobat;7.0.0.0;Adobe Systems Incorporated\nMicrosoft Windows Desktop Targeting Pack - 8.0.10 (x64);64.40;Microsoft Corporation\nAdobe Acrobat (64-bit);25.001;Adobe\nTestHttp;1.0.0.0;\nVMware Player;12.5;VMware, Inc.\nthink-cell;14.0.38.522;think-cell Operations GmbH\nvlc-plugin-video-output:amd64;3.0.21-0astra2+b2;Debian Multimedia Maintainers <debian-multimedia@lists.debian.org>\n1C:Предприятие 8.2 (x86-64) (8.2.19.130);8.2;1C\nK-Lite Codec Pack;17.6.8;KLCP\nWindows Internet Explorer 10;10.00.9200.16438;Microsoft Corporation\nHP Connection Optimizer;2.0;HP Inc\nAdobe Dynamic Link Manager 14;14.0.0;Adobe\nAltiris Service Control Task Agent;6.0;Altiris Inc.\nNVIDIA-SMI 516.94;8.17.15.1694;NVIDIA Corporation\nSAS.Planet;1.0.0.0;SAS Group\nCorel Graphics - Windows Shell Extension 32 Bit Keys;19.0;Corel Corporation\nKasten K10 Plug-In UI extension for Veeam Backup & Replication;12.0.1.4;Veeam Software Group GmbH\nVMware Workstation;12.5.7;VMware, Inc.\nhppSendFaxM1522;003.000;Название организации\nVisual Studio Code;1.100.0;Microsoft Corporation\nMonkey's Audio;3.99;Matthew T. Ashland\nAdobe Acrobat;15.7.20033.133275;Adobe Systems Incorporated\nMicrosoft Windows Desktop Targeting Pack - 8.0.10 (x64);64.40;Microsoft Corporation\nKaspersky Embedded Systems Security for Windows;3.3.0.87;AO Kaspersky Lab\n1С:Предприятие 8 (8.3.24.1548);8.3.24.1548;1С-Софт\nAutoCAD;17.2.56.0;Autodesk, Inc.\nSystem software for Windows 2.8.7;2.8.7;CUTA\nYandex;1.6.2.855;YANDEX LLC\nCrystalCPUID;4, 15, 2, 0;Crystal Dew World\nAutodesk Desktop App;8.2.0.34;Autodesk\nPostman;9.9.3;Postman\nEFA;7.4.2.66;Broadcom\nIGCC;1.100.5131.0;Intel Corporation\nthink-cell;11.0.33.8;think-cell Operations GmbH\nHP Connection Optimizer;2.0;HP\nFileAccessErrorView;1.22;NirSoft\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664䎗�　耀;12.0;Microsoft Corporation\nmpress;1.27;MATCODE Software\nthink-cell;14.0;think-cell Operations GmbH\nQueue.Kiosk;1.0.0;Queue.Kiosk\nJazz;24.9.2028.0;SaluteJazz\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nSQL Server 2012 Integration Services;11.0;Microsoft Corporation\nglow;2.1.1;charmbracelet\nFlash OS images to SD cards and USB drives, safely and easily.;2.1.2;Balena Ltd. <hello@balena.io>\nAdobe Acrobat;7.0.5.2005092300;Adobe Systems Incorporated\nAD LDS Instance VMwareVCMSDS;;Microsoft Corporation\nNetworkManager-libnm.x86_64;1:1.32.10-4.el8;@rhel-8-for-x86_64-baseos-rpms\nAdobeLogCollectorTool;5.0.0.61;Adobe Systems Incorporated\nlibqt4-dbus:amd64;4:4.8.7+dfsg-20astra1;Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\nTeamViewer;4.0;TeamViewer GmbH\nplymouth.x86_64;0.8.9-0.34.20140113.el7;@InstallMedia-BaseOS7.9\nDeviceInstaller;4.300.1.500;Lantronix\nChromium Installer;141.0.7379.0;The Chromium Authors\nГРАНД-Смета, версия 2025.3;15.3.7;МГК ГРАНД\nxdg-menu;0.2;SUSE LLC <https://www.suse.com/>\ncredo_transcor Credo Framework Application;2024.1.1.254;КРЕДО-ДИАЛОГ\nAutodesk Desktop App;8.2.0.34;Autodesk, Inc.\ncogl.x86_64 * @anaconda/7.6 * 1.22.2-2.el7;;\nAdobeLogCollectorTool;5.0.0.61;Adobe Systems Incorporated\nXerox WorkCentre 3335;1.00 (21;Xerox Corporation\nHP Simple Pass;5.1.0.175;Hewlett Packard\nVMware Workstation;12.5;VMware, Inc.\nExeInfo;1.01;NirSoft\nlibbluray.x86_64 * @anaconda/7.4 * 0.2.3-5.el7;;\nTeamViewer;15.1.3937.0;TeamViewer Germany GmbH\nthink-cell;7.0.24.170;think-cell Software GmbH\nMicrosoft Project профессиональный 2013;15.0;Microsoft Corporation\nfuse-libs.x86_64 * @anaconda * 2.9.7-12.el8;;\nMicrosoft Office;15.0.5337.1000;Microsoft Corporation\nconnectivity.connectionserver.drivers.db2.odbc.config-4.0-ru-nu;14.2.4.2410;SAP BusinessObjects\nViewer;3.5.5401.27093;SpaceTeamLab, Ltd.\nthink-cell;7.0.24.150;think-cell Software GmbH\n1C:Предприятие 8.2 (8.2.19.106);8.2;1C\neltex-johnny * Victor Abarenov <victor.abarenov@eltex-co.ru> * 1.29-257;;\nNVIDIA Install Application;2.265.36.0;NVIDIA Corporation\nKontur.VNC;4.4.23.1914;PF SKB Kontur ZAO\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nAutoCAD;17.2.56.0;Autodesk\nAutodesk Desktop App;8.2.0.34;Autodesk Inc.\nMicrosoft Edge;1.3.185.27;Microsoft Corporation\nAutodesk Desktop Delivery Application;1.34.0.1;Autodesk, Inc.\nYandexTelemost;1.0.35.1174;Yandex\nIntel(R) Rapid Storage Technology Management Service;18.7.7.1013;Intel Corporation\nSmartSan;1, 0, 0, 1;QLogic\nKontur.VNC;4.4.23.1914;PF SKB Kontur ZAO\ntesthost.arm64;17.14.0-preview-25117-01;Microsoft Corporation\nnanoCAD Стройплощадка 22.0 x64;22.0;Нанософт разработка\nKaspersky Endpoint Security for Windows;11.15;\nInkscape Portable;0.92.4.0;PortableApps.com\nHP Install;6.9.0.24630;HP Inc.\nvim-data.noarch * @updates * 2:9.1.016-1.el7.3;;\nAdobe Acrobat;2.1;Adobe Systems Incorporated\nAutoPlay Menu Builder;8.0;\"ООО \"\"ВЕГА ИНСТРУМЕНТС\"\"\"\ntp.json.java.boe-1.0_sap.1-core-nu;14.2.4.2649;SAP BusinessObjects\nMicrosoft (R) Visual Studio;6.00.9437;Microsoft Corporation\n1С:Предприятие 8 (8.3.20.1674);8.3.20.1674;1С-Софт\nIsoBuster;3.0.0;Smart Projects\nNVIDIA-SMI 461.09;8.17.14.6109;NVIDIA Corporation\nКонфигуратор КСОДУ;1.2.3.16;Sum of the technologies\nMicrosoft SQL Server;14.0.1016.246;Microsoft Corporation\nChromium;138.0.7176.0;The Chromium Authors\nfuse-common;3.10.5;redsoft\nplatform.services.java.publishingservice-4.0-core-nu;14.3.4.5181;SAP BusinessObjects\nAdobe Acrobat;22.1.20142.0;Adobe Systems Incorporated\nnanoCAD BIM Вентиляция x64 24.1;24.1;Nanosoft Razrabotka\nXbox;12.80.210811001;Microsoft Corporation\nmariadb-backup;10.3.35;Red Hat, Inc.\nVMware Workstation;16.2.1;VMware, Inc.\nHP Connection Optimizer;2.0;HP Inc.\nBrowserCore;64.0.3282.24;TeamDev Ltd\n1C Предприятие 7.7;77.27;\nrepoaccess.ctplugin.java.shared_classes-4.0-core-nu;14.0;SAP BusinessObjects\nKaspersky Embedded Systems Security for Windows;3.4.0.36;AO Kaspersky Lab\nPostman;11.27.3;Postman\nRealtek PCIe Media Card Reader Drivers;10.0.22621.21357;HP Inc.\nMicrosoft SQL Server 2016;13.2.5888.11;Microsoft Corporation\nHP Recovery Image & Software Download Tool (ThinUpdate) 64-b;2.2.9;Hewlett-Packard Company\n1C:Enterprise 8.0;8.0.16.2;1C\ntp.gzip-1.2.3-core-32;14.2.4.2649;SAP BusinessObjects\nJava Platform SE Auto Updater;2.8.162.12;Oracle Corporation\n1C:Enterprise 8.2 (8.2.18.61);8.2.18.61;1C\npcp-pmda-lustrecomm;5.1.1;Red Hat, Inc.\ngspell.x86_64;1.8.1-1.el8;@rhel-8-for-x86_64-appstream-rpms\nSecurity Update for Microsoft Excel 2013 (KB5002384) 64-Bit Edition;;MicrosoftInstallDate    :\npython3-libvirt;4.5.0;Red Hat, Inc.\nFoxit ConnectedPDF Popup Notice Windows.;9.7.0.29430;Foxit Software Inc.\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nAdobe Acrobat;22.3.20282.0;Adobe Systems Incorporated\nLogTransport Application;8.1.0.19.48545;Adobe Systems Incorporated\nDrive Snapshot for WindowsNT;1.44.17289;Tom Ehlert Software\nnanoCAD BIM Вентиляция x64;25.0.12926.12926;Nanosoft\nNode.js;18.20.2;Node.js\n", "file": "02_Легкая_форма_дублитоза_v3.csv"}, {"band": "Дублитоз средней тяжести", "tone": "#c07800", "index": 61, "rows": 288, "csv": "Наименование ПО;Версия;Издатель\ndataservices.embeddedhelp-4.0-en-64;14.2.13.2467;SAP BusinessObjects\nAutoCAD;17.2.56.0;Autodesk, Inc\n1C Предприятие 7.7;77.27;\nYandexTelemost;1.0.35.1174;Yandex\nRealtek Audio Codec Driver;6.0.1.7116;Lenovo Group Limited\n1C:Enterprise 8 Thin client (8.3.24.1691);8.3;1C-Soft\nTeamViewer;15.21.6.0;TeamViewer Germany GmbH\nTeamViewer;15.73.5.0;TeamViewer Germany GmbH\nHP Recovery Image & Software Download Tool (ThinUpdate) 64-b;2.2.9;Hewlett-Packard Company\nnanoCAD BIM Электро;23.1.5734.5734;Nanosoft Razrabotka\nWindows Terminal;1.18.231009002-preview;Microsoft Corporation\nnodejs;18.20.1;RED SOFT\nGoogle Chrome Installer;98.0.4758.82;Google LLC\nhppSendFaxM1522;003.000;Название организации\nHeroes of Might and Magic V (обновление 1.3);1.3;Nival Interactive\nnanoCAD BIM ОПС 23.0 x64;23.0;Nanosoft Razrabotka\nMicrosoft SQL Server 2016;13.2.5888.11;Microsoft Corporation\n1C:Enterprise 8.2 (8.2.18.61);8.2.18.61;1C\nAdobe Photoshop 2023;24.1;Adobe Systems Incorporated\nQEMU guest agent;102.7;RedHat\nnanoCAD Отопление x64 20.0;20.0;Nanosoft\nCorel Graphics - Windows Shell Extension 32 Bit Keys;19.0;Corel Corporation\nChromium Installer;141.0.7379.0;The Chromium Authors\nnanoCAD Отопление 20.0 x64;20.0;Nanosoft\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664涑Ɪ᐀耀;12.0;Microsoft Corporation\n1С:Предприятие 8 (8.3.20.1674);8.3.20.1674;1С-Софт\nKaspersky Embedded Systems Security for Windows;3.4.0.36;AO Kaspersky Lab\nTeamViewer;15.1.3937.0;TeamViewer Germany GmbH\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\niwl6000g2a-firmware.noarch;18.168.6.1-99.el8.1;@anaconda\nMicrosoft® Visual Studio®;16.8.30907.39;Microsoft Corporation\nDisk Drill 4.4.613.0킦淩Ȁ蠀噼疴;4.4;CleverFiles\nlibqt4-dbus:amd64;4:4.8.7+dfsg-20astra1;Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\nlibqt5sql5-sqlite:amd64;Debian;*\nnanoCAD BIM Вентиляция x64;25.0.12926.12926;Nanosoft\nplatform.services.java.publishingservice-4.0-core-nu;14.3.4.5181;SAP BusinessObjects\n1C:Enterprise 8 Thin client (8.3.15.1565);8.3;1C-Soft\nnanoCAD Стройплощадка 22.0 x64;22.0;Нанософт разработка\nMicrosoft Windows Desktop Runtime - 6.0.35 (x86)呥欇Ȁ谀\u0001耄D;6.0;Microsoft Corporation\nArcGIS Desktop Background Geoprocessing 10.8.1;10.8.1.14362;Esri\nFileZilla;3.60.2;Tim Kosse\nlibdrm.x86_64;2.4.103-1.el8;@rhel-8-for-x86_64-appstream-rpms\nМойОфис Почта 2.8 (x64 ru);2.8;ООО «НОВЫЕ ОБЛАЧНЫЕ ТЕХНОЛОГИИ»\nThunderbolt(TM) Software;17.4.78.15;Intel Corporation\nlibxcb-xparsec:amd64;1.14-2astra.se10;Debian X Strike Force <debian-x@lists.debian.org>\nMicrosoft ® Visual Studio ®;16.8.11214.1;Microsoft Corporation\nABBYY FineReader 12 Corporate;12.1;ABBYY Production LLC\nHP Connection Optimizer;2.0;HP Inc.\nPostman;1.3;Alexey Popov (Ghost)\nViewer;3.5.5401.27093;SpaceTeamLab, Ltd.\nKasten K10 Plug-In UI extension for Veeam Backup & Replication;12.0.1.4;Veeam Software Group GmbH\nAD LDS Instance VMwareVCMSDS;;Microsoft Corporation\nTeamViewer;15.21.8.0;TeamViewer Germany GmbH\nGeodeWPF;1.1.7168.6305;Golden Software, LLC\nfly-admin-driver;;Medvedev Dmitry <dmedvedev@astralinux.ru>\nSAS.Planet;1.0.0.0;SAS Group\nMicrosoft® Windows(TM) Operating System;3.10;Microsoft\nTeamViewer QS;15.11.6.0;TeamViewer\nUnrealEngine3;1.0.4589.30310;Epic Games, Inc.\nlibwrap0:amd64;7.6.q-30;Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\n1C:Enterprise 8.2 (8.2.19.130);8.2;1C\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664鷄䄩Ѐ耀;12.0;Microsoft Corporation\nplatform.services.java.publishingservice-4.0-core-nu;14.3.4.5181;SAP BusinessObjects\nMicrosoft (R) Visual Studio;6.00.9437;Microsoft Corporation\nExeInfo;1.01;NirSoft\nnanoCAD BIM Электро x64 23.1;23.1;OOO Nanosoft Razrabotka\nAdobeLogCollectorTool;5.0.0.61;Adobe Systems Incorporated\nsle-module-desktop-applications-release;15.7;SUSE LLC <https://www.suse.com/>\nNI Portable Configuration for 64 Bit Windows 19.5.0;19.50;National Instruments\nlibcephfs2;19.2.0-0ubuntu0.24.04.2;Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\nshell_executor.exe;3.5.5030 (vvrao);Intel Corporation\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nglow;2.1.1;charmbracelet\nMicrosoft Project профессиональный 2013;15.0;Microsoft Corporation\nYandex;1.6.2.855;YANDEX LLC\nMozilla Firefox (x86 en-US);141.0;Mozilla\nNVIDIA-SMI 461.09;8.17.14.6109;NVIDIA Corporation\npostgrespro-std-14-client;14.6.1;Postgres Professional\nthink-cell;11.0.33.8;think-cell Operations GmbH\nVMware Workstation;16.2.3;VMware, Inc.\nlibbluray.x86_64 * @anaconda/7.4 * 0.2.3-5.el7;;\nDr.Web (R);5.00.0.12170;Doctor Web, Ltd.\nWindows Internet Explorer 10;10.00.9200.16438;Microsoft Corporation\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nnanoCAD BIM Вентиляция x64 24.1;24.1;Nanosoft Razrabotka\n1C:Enterprise 8 Thin client (8.3.6.2041);8.3;1C\nVMware Workstation;16.2.1;VMware, Inc.\nKaspersky Endpoint Agent 3.11;3.11;\"АО \"\"Лаборатория Касперского\"\"\"\nMouseWare;8.21;Logitech\nplymouth.x86_64;0.8.9-0.34.20140113.el7;@InstallMedia-BaseOS7.9\nAdobe Acrobat (64-bit);25.001;Adobe\nABBYY FineReader 11 Corporate Edition;11.11;ABBYY Production LLC\nAdobe Acrobat;2.1;Adobe Systems Incorporated\nYandexTelemost;1.0.35.1174;Yandex\nMicrosoft® Windows(TM) Operating System;3.10;Microsoft Corporation\nlibdjvulibre21:amd64;3.5.28-2+b1;Barak A. Pearlmutter <bap@debian.org>\nAutodesk Desktop App;8.2.0.34;Autodesk Inc.\nkbd;2.0.4-4;Console utilities maintainers <pkg-kbd-devel@lists.alioth.debian.org>\n1C:Enterprise 8.2;8.2.14.540;1C\nMicrosoft SQL Server 2014;12.2.5000.0;Microsoft Corporation\nTRACE MODE;5, 1, 5, 0;AdAstra Research Group\nMSS;23.1.1.85;Keysystems\nQGIS 3.10.12 'A Coruсa';3.10;QGIS Development Team\nEFA;7.4.2.66;Broadcom\nКонфигуратор КСОДУ;1.2.3.16;Sum of the technologies\nthink-cell;14.0.38.522;think-cell Operations GmbH\nAutoCAD;17.2.56.0;Autodesk, Inc.\nQGIS 3.10.12 'A Coruсa';3.10;QGIS Development Team\nVMware Workstation;16.2;VMware, Inc.\nAutodesk Windows Components for AutoCAD;3.0.267.0;Autodesk, Inc.\nPDF24 Creator;11.29.0;geek software GmbH\nnanoCAD BIM СКС;24.0.5767.5767;Nanosoft Razrabotka\nMicrosoft Office;15.0.5337.1000;Microsoft Corporation\nQueue.Kiosk;1.0.0;Queue.Kiosk\nurw-base35-p052-fonts;20170801;CentOS\ncredo_transcor Credo Framework Application;2024.1.1.254;КРЕДО-ДИАЛОГ\ncogl.x86_64 * @anaconda/7.6 * 1.22.2-2.el7;;\njson-c.x86_64 * @rhel-8-for-x86_64-baseos-rpms * 0.13.1-0.4.el8;;\nKaspersky Endpoint Security for Windows;11.15;\nAdobe Reader and Acrobat Manager;1.5.5.0;Adobe Systems Incorporated\nAdobe Acrobat;25.1.20623.0;Adobe\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664�懹ഀ谀ဈ狐禐Ή禼ΉȀ;12.0;Microsoft Corporation\nАДЕПТ: Проект;12.5.0.21;АДЕПТ\nplatform.client.java.app.cmc.webpath_bundles-4.0-ru-nu;14.2;SAP BusinessObjects\ngrub2.x86_64;@InstallMedia-BaseOS7.9;1:2.02-0.87.el7\nMKVToolNix;44.0.0;Moritz Bunkus\nAshampoo Burning Studio 10 Portable;0.0.0.0;PortableAppZ.blogspot.com\nTRACE MODE;5, 1, 5, 0;AdAstra Research Group, Ltd\nethtool.x86_64;@anaconda;2:4.8-7.el7\nAdobe Acrobat;7.0.5.2005092300;Adobe Systems Incorporated\nMicrosoft Visual C++ 2012 Redistributable (x86) - 11.0.61030�ꨇᘀ谀ဈ慛唐͹啌͹Ȁ;11.0;Microsoft Corporation\nKaspersky Embedded Systems Security;1.1.0.104;AO Kaspersky Lab\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.30501Ⱶ鐵؀谀ဈ溃弨Ϝ彤ϜȀ;12.0;Microsoft Corporation\nnanoCAD Стройплощадка x64;22.0.3838.6048;ООО «Нанософт разработка»\nKaspersky Endpoint Agent;3.11.0.216;AO Kaspersky Lab\nSecurity Update for Microsoft Excel 2013 (KB5002384) 64-Bit Edition;;MicrosoftInstallDate    :\nТИМ КРЕДО 3D ВЬЮВЕР;24.11;компания «Кредо-Диалог»\nSkype;8.58;Skype Technologies S.A.\nCorelDRAW Graphics Suite X6 - PHOTO-PAINT;16.1;Corel Corporation\nnanoCAD BIM Электро 23.1 x64;23.1;Nanosoft Razrabotka\nAutoPlay Menu Builder;8.0;\"ООО \"\"ВЕГА ИНСТРУМЕНТС\"\"\"\nPostman;11.83.0;Postman\nMozilla Firefox (x64 ru);141.0;Mozilla\nfuse-libs.x86_64 * @anaconda * 2.9.7-12.el8;;\nFileZilla 3.60.1;3.60;Tim Kosse\nTRACE MODE;5, 1, 5, 0;AdAstrA Research Group, Ltd.\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664㬅؀蠀ᛨ橍ᛄ橍᚜橍\u0001;12.0;Microsoft Corporation\n1C:Enterprise 8.0;8.0.16.2;1C\nVMware Workstation;4.5.2.8848;VMware, Inc.\nCorelDRAW Graphics Suite X6 - Writing Tools;16.1;Corel Corporation\nnanoCAD BIM ОПС x64 23.0;23.0;OOO Nanosoft Razrabotka\nMicrosoft Visual Studio Setup;16.8.30717.126;Microsoft Corporation\nAggreGate 6.33.01;6.33.01;Tibbo Systems\nMozilla Firefox (x86 ru);141.0;Mozilla\n1C:Enterprise 8 Thin client (8.3.13.1809);8.3.13.1809;1C-Soft\nMKVToolNix;44.0.0;Moritz Bunkus\nNVIDIA-SMI 516.94;8.17.15.1694;NVIDIA Corporation\nthink-cell;14.0.38.494;think-cell Operations GmbH\nfuse-common;3.10.5;redsoft\ncredo_transcor Credo Framework Application;2024.1.1.254;КРЕДО-ДИАЛОГ\n1C:Предприятие 8.2 (x86-64) (8.2.19.130);8.2;1C\nRStudio;1,1,423,0;RStudio, Inc.\nPostman;9.9.3;Postman\nnanoCAD BIM ОПС;23.0.5497.5497;Nanosoft Razrabotka\n7-Zip SFX;1.6.0.2712;Oleg N. Scherbakov\nSystem software for Windows 2.8.7;2.8.7;CUTA\nAdobe Acrobat;22.3.20310.0;Adobe Systems Incorporated\nnanoCAD BIM Вентиляция;22.0.5600.5600;Nanosoft\nWindows® Internet Explorer;10.00.9200.16521;Microsoft Corporation\nnanoCAD BIM СКС x64 24.0;24.0;OOO Nanosoft Razrabotka\nlibXxf86misc.x86_64;@anaconda/7.6;1.0.3-7.1.el7\n1С:Предприятие 8 (8.3.24.1548);8.3.24.1548;1С-Софт\nSmartSan;1, 0, 0, 1;QLogic\nMicrosoft® Office;15.0.0169.500;Microsoft Corporation\nAdobe Acrobat;7.0.0.0;Adobe Systems Incorporated\nSAS.Planet;1.0.0.0;SAS Group\nAdobe Acrobat;22.3.20282.0;Adobe Systems Incorporated\nK-Lite Codec Pack;17.6.8;KLCP\nТИМ КРЕДО ВЬЮВЕР;24.11;компания «Кредо-Диалог»\nAdobe Acrobat;22.1.20142.0;Adobe Systems Incorporated\nAdobe Acrobat;15.7.20033.133275;Adobe Systems Incorporated\npython3-libvirt;4.5.0;Red Hat, Inc.\nAltiris Service Control Task Agent;6.0;Altiris Inc.\nKaspersky Embedded Systems Security 2.0;2.0.0.388;AO Kaspersky Lab\nFoxit ConnectedPDF Popup Notice Windows.;9.7.0.29430;Foxit Software Inc.\nСБИС Плагин;23.7148;Tensor Company Ltd\nglow;2.1.1;charmbracelet\nDIALux evo;3.2.0.0;DIAL GmbH\nIGCC;1.100.5131.0;Intel Corporation\nmozjs17.x86_64;@rhel-7-server-rpms;17.0.0-20.el7\nСПДС x64 25.0;25.0;Нанософт разработка\nglusterfs-client-xlators.x86_64 * @baseos * 6.0-56.4.el8;;\nNode.js;14.21.3;Node.js Foundation\nVMware Workstation;12.5;VMware, Inc.\nMicrosoft PowerBI Desktop (x64);2.118.621.0;Microsoft Corporation\nPokerStars;3.0.0.658;PokerStars\nAdobe Photoshop 2023;24.1;Adobe Inc.\nMicrosoft(R) Windows NT(R) Operating System;4.71.0728.0;Microsoft Corporation\nIntel(R) Common User Interface;6.15.100.7859;Intel Corporation\nfly-admin-samba;1.5.13+ci4;Vladislav Mileshkin <support@rusbitech.ru>\nHP Connection Optimizer;2.0;HP\nAutodesk Desktop App;8.2.0.34;Autodesk, Inc.\neltex-johnny * Victor Abarenov <victor.abarenov@eltex-co.ru> * 1.29-257;;\nMozilla Firefox (x64 en-US);141.0;Mozilla\nLinkRelevanceMonitor;1.5.0+4345dd0.4345dd0dab968c5af8209f4bed1830b4cc3c5f8c;ConsultantPlus\nSAP Front-End Setup for the Windows(R) Environment;2008, 0, 0, 200;SAP AG\nnanoCAD BIM СКС 24.0 x64;24.0;Nanosoft Razrabotka\nFileZilla 3.60.2;3.60.2;Tim Kosse\nAdobe LiveCycle Designer;11, 0, 8, 20180110, 1, 931507;Adobe Systems Incorporated\nСПДС 25.0 x64;25.0;Нанософт разработка\nCorelDRAW Graphics Suite X6 - PHOTO-PAINT (x64);16.1;Corel Corporation\nopenjdk-11-jdk-headless;;OpenJDK Team <openjdk-11@packages.debian.org>\nMicrosoft SQL Server;14.0.1016.246;Microsoft Corporation\nFineReader;6.0.0.426;ABBYY (BIT Software)\nAggreGate 6.33.01;6.33.01;Tibbo Systems\nABBYY FineReader 10 Professional Edition;10.501;ABBYY\nIntel(R) Chipset Device Software;10.1;Intel(R) Corporationꢏ☀言HKEY_LOCAL_MACHINE\nVMware Workstation;12.5.7;VMware, Inc.\nAutodesk Windows Components;3.0.1.1;Autodesk, Inc.\nMicrosoft Visual Studio Community;16.8.30907.101;Microsoft Corporation\nAdobe Photoshop 2023;24.1;Adobe\nsolar-api-gateway;;dozor-support@solarsecurity.ru\nNetworkManager-libnm.x86_64;1:1.32.10-4.el8;@rhel-8-for-x86_64-baseos-rpms\npostgrespro-std-14;14.6.1;Postgres Professional\nthink-cell;14.0;think-cell Operations GmbH\nplatform.services.java.publishingservice-4.0-core-nu;14.3.4.5181;SAP BusinessObjects\ntesthost.arm64;17.14.0-preview-25117-01;Microsoft Corporation\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664䎗�　耀;12.0;Microsoft Corporation\nlibselinux-python;2.5;Red Hat, Inc.\nМойОфис Почта;2.8;(с) ООО «НОВЫЕ ОБЛАЧНЫЕ ТЕХНОЛОГИИ», 2013–2024\nXerox WorkCentre 3335;1.00 (21;Xerox Corporation\npciutils-libs.x86_64;3.5.1-3.el7;@rhel-7-server-rpms\nVisual Studio Code;1.100.0;Microsoft Corporation\nUnrealEngine3;1.0.4589.30310;Epic Games, Inc.\nHP Connection Optimizer;2.0;HP Inc\nchromium;138.0.7204.168;redsoft\nNI Portable Configuration for 64 Bit Windows 19.5.0;19.50;National Instruments\nthink-cell;7.0.24.170;think-cell Software GmbH\nNode.js;18.20.2;Node.js\ntp.gzip-1.2.3-core-32;14.2.4.2649;SAP BusinessObjects\nMouseWare;8.21;Logitech Inc.\nthink-cell;11.0.32.426;think-cell Operations GmbH\nVMware Workstation;16.0.0;VMware, Inc.\n1C Предприятие 7.7;77.25;\nKaspersky Embedded Systems Security for Windows;3.3.0.87;AO Kaspersky Lab\nvim-data.noarch * @updates * 2:9.1.016-1.el7.3;;\nMicrosoft® Windows® Operating System;10.0.19041.2180;Microsoft Corporation\nABBYY FineReader 11 Corporate Edition;11.11;ABBYY\nAutoCAD;17.2.56.0;Autodesk\nAcrobat  Distiller for Windows;10.1.16.13;Adobe Systems Incorporated.\nFlash OS images to SD cards and USB drives, safely and easily.;2.1.2;Balena Ltd. <hello@balena.io>\nJava(TM) Platform SE 20.0.1;20.0.1.0;Oracle Corporation\nima-evm-utils.x86_64 * @anaconda * 1.3-4.el7;;\nnode-validate-npm-package-name;3.0.0-1;Debian Javascript Maintainers <pkg-javascript-devel@lists.alioth.debian.org>\nДрайверы Рутокен鳾ግⰀ谀☠摷\u0001;4.21;\"Компания \"\"Актив\"\"\"\nconnectivity.connectionserver.drivers.db2.odbc.config-4.0-ru-nu;14.2.4.2410;SAP BusinessObjects\nclickhouse-odbc;;root <root@astra>\nFineReader;6.0.0.568;ABBYY (BIT Software)\nTeamViewer;4.0;TeamViewer GmbH\nLogTransport Application;8.1.0.19.48545;Adobe Systems Incorporated\nAutodesk Desktop App;8.2.0.34;Autodesk\nthink-cell;1.17.980.0;think-cell Software GmbH\nAshampoo Burning Studio 10 Portable;0.0.0.0;PortableAppZ.blogspot.com\ngspell.x86_64;1.8.1-1.el8;@rhel-8-for-x86_64-appstream-rpms\nthink-cell;7.0.24.150;think-cell Software GmbH\nlibkf5activities5:amd64;5.104.0-1+b2;Debian Qt/KDE Maintainers <debian-qt-kde@lists.debian.org>\nSkype, версия 8.58;8.58;Skype Technologies S.A.\nPDF24 Creator;11.29.0;Geek Software GmbH\nCorelDRAW Graphics Suite X6 - Writing Tools (x64);16.1;Corel Corporation\nMouseWare;8.21;Logitech, Inc.\nMicrosoft Project профессиональный 2013;15.0;Microsoft Corporation\nDr.Web ®;5.0.0.10200;Doctor Web, Ltd.\nEpson Event Manager;2, 0, 0, 0;SEIKO EPSON Corporation\nChromium;138.0.7176.0;The Chromium Authors\nMicrosoft Edge;1.3.185.27;Microsoft Corporation\nMicrosoft Visual Studio Professional;16.8.31005.135;Microsoft Corporation\nrubygem-diffy;3.4.2;Red Hat, Inc.\nvlc-plugin-video-output:amd64;3.0.21-0astra2+b2;Debian Multimedia Maintainers <debian-multimedia@lists.debian.org>\nHP Install;6.9.0.24630;HP Inc.\n1C:Enterprise 8.0;8.0.13;1C\n1С:Предприятие 8 (x86-64) (8.3.21.1607);8.3.21.1607;1С-Софт\nPostman;11.27.3;Postman\n\"ImportExportDataRL,\n\u0001P\";;2024-05-15 19:17:50.71121\n1C:Предприятие 8.2 (8.2.19.106);8.2;1C\nnodejs;14.21.1;CentOS\nNetworkManager-tui.x86_64;1:1.30.0-10.el8_4;@rhel-8-for-x86_64-baseos-rpms\nsystem-config-printer-libs.noarch * @anaconda/7.6 * 1.4.1-21.el7;;\nCrystalCPUID;4, 15, 2, 0;Crystal Dew World\n", "file": "03_Дублитоз_средней_тяжести_v3.csv"}, {"band": "Хроническая форма", "tone": "#d1450b", "index": 39, "rows": 264, "csv": "Наименование ПО;Версия;Издатель\nKaspersky Embedded Systems Security 2.0;2.0.0.388;AO Kaspersky Lab\nIntel Rapid Storage Technology;17.2.8.1029;HP Inc\nnanoCAD BIM СКС 24.0 x64;24.0;Nanosoft Razrabotka\nGeodeWPF;1.1.7168.6305;Golden Software, LLC\nrubygem-diffy;3.4.2;Red Hat, Inc.\nKaspersky Endpoint Agent;3.11.0.216;AO Kaspersky Lab\ngrub2.x86_64;@InstallMedia-BaseOS7.9;1:2.02-0.87.el7\nAdobe Acrobat;15.7.20033.133275;Adobe Systems Incorporated\nthink-cell;7.0.24.170;think-cell Software GmbH\nMouseWare;8.21;Logitech, Inc.\npostgrespro-std-14-client;14.6.1;Postgres Professional\n1C:Enterprise 8.2 (8.2.19.130);8.2;1C\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nnanoCAD BIM Электро x64 23.1;23.1;OOO Nanosoft Razrabotka\nMicrosoft Visual Studio Community;16.8.30907.101;Microsoft Corporation\nnanoCAD BIM ОПС 23.0 x64;23.0;Nanosoft Razrabotka\nFileZilla 3.60.1;3.60;Tim Kosse\nAdobe Acrobat;7.0.5.2005092300;Adobe Systems Incorporated\n1С:Предприятие 8 (8.3.24.1548);8.3.24.1548;1С-Софт\nДиаг.Плагин;3.0.27.957;\"АО \"\"ПФ \"\"СКБ Контур\"\"\"\nTeamViewer;15.21.6.0;TeamViewer Germany GmbH\nHP Connection Optimizer;2.0;HP\npgAdmin 4;8.2;The pgAdmin Development Team\nMicrosoft® Office;15.0.0169.500;Microsoft Corporation\nKaspersky Endpoint Security 12 для Windows;12.3.0.493;\"АО \"\"Лаборатория Касперского\"\"\"\nСБИС Плагин;23.7148;Tensor Company Ltd\nPDF24 Creator;11.29.0;geek software GmbH\nAdobe Photoshop 2023;24.1;Adobe\nTeamViewer;15.73.5.0;TeamViewer Germany GmbH\n1C:Enterprise 8.2;8.2.14.540;1C\nABBYY FineReader 11 Corporate Edition;11.11;ABBYY\nnanoCAD BIM Вентиляция x64 24.1;24.1;Nanosoft Razrabotka\nSkype, версия 8.58;8.58;Skype Technologies S.A.\nCorelDRAW Graphics Suite X6 - Writing Tools;16.1;Corel Corporation\nMicrosoft ® Visual Studio ®;16.8.11214.1;Microsoft Corporation\nMicrosoft(R) Windows NT(R) Operating System;4.71.0728.0;Microsoft Corporation\nTeamViewer 13.1.3629;13.1;lrepacks.ru\n1C Предприятие 7.7;77.25;\nAutodesk Desktop App;8.2.0.34;Autodesk\nAdobe Acrobat;2.1;Adobe Systems Incorporated\nnanoCAD Облака точек 24.0;24.0;Нанософт разработка\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nMicrosoft(R) Windows NT(R) Operating System;4.71.0728.0;Microsoft Corporation\nnanoCAD BIM СКС x64 24.0;24.0;OOO Nanosoft Razrabotka\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nYandex;1.6.2.855;YANDEX LLC\n1C:Enterprise 8 Thin client (8.3.13.1809);8.3.13.1809;1C-Soft\nVMware Workstation;16.2;VMware, Inc.\nKaspersky Endpoint Security 11 для Windows;11.3.0.773;АО Лаборатория Касперского\nMicrosoft Windows Desktop Runtime - 6.0.35 (x86)呥欇Ȁ谀\u0001耄D;6.0;Microsoft Corporation\nCorelDRAW Graphics Suite X6 - PHOTO-PAINT;16.1;Corel Corporation\nGoogle Chrome;139.0;Google LLC\nMozilla Firefox (x86 en-US);141.0;Mozilla\nSecurity Update for Microsoft Excel 2013 (KB5002384) 64-Bit Edition;;MicrosoftInstallDate    :\nMicrosoft Edge;1.3.185.27;Microsoft Corporation\nAutoCAD;17.2.56.0;Autodesk\nТИМ КРЕДО ВЬЮВЕР;24.11;компания «Кредо-Диалог»\npostgrespro-std-14;14.6.1;Postgres Professional\nKaspersky Endpoint Agent 3.11;3.11;\"АО \"\"Лаборатория Касперского\"\"\"\n\"ImportExportDataRL,\n\u0001P\";;2024-05-15 19:17:50.71121\nGeodeWPF;1.1.7168.6305;Golden Software, LLC\nplatform.client.java.app.cmc.webpath_bundles-4.0-ru-nu;14.2;SAP BusinessObjects\n1С:Предприятие 8 (x86-64) (8.3.21.1607);8.3.21.1607;1С-Софт\nAD LDS Instance VMwareVCMSDS;;Microsoft Corporation\nrubygem-diffy;3.4.2;Red Hat, Inc.\n1C:Предприятие 8.2 (8.2.19.106);8.2;1C\nplatform.client.java.app.cmc.webpath_bundles-4.0-ru-nu;14.2;SAP BusinessObjects\nnanoCAD Стройплощадка 22.0 x64;22.0;Нанософт разработка\nnanoCAD BIM Электро 23.1 x64;23.1;Nanosoft Razrabotka\nMouseWare;8.21;Logitech\nthink-cell;7.0.24.150;think-cell Software GmbH\nMicrosoft Office;15.0.5337.1000;Microsoft Corporation\nВЭД-Инфо;17.11;ООО «СТМ»\nKaspersky Embedded Systems Security for Windows;3.3.0.87;AO Kaspersky Lab\nplatform.client.java.app.cmc.webpath_bundles-4.0-ru-nu;14.2;SAP BusinessObjects\nFileZilla 3.60.2;3.60.2;Tim Kosse\nYandex;1.6.2.855;YANDEX LLC\nthink-cell;1.17.980.0;think-cell Software GmbH\nMicrosoft Visual Studio Professional;16.8.31005.135;Microsoft Corporation\nДрайверы Рутокен鳾ግⰀ谀☠摷\u0001;4.21;\"Компания \"\"Актив\"\"\"\ntesthost.arm64;17.14.0-preview-25117-01;Microsoft Corporation\nPostman;11.83.0;Postman\nMicrosoft Visual C++ 2012 Redistributable (x86) - 11.0.61030�ꨇᘀ谀ဈ慛唐͹啌͹Ȁ;11.0;Microsoft Corporation\nAdobe Acrobat;25.1.20623.0;Adobe\nAdobe Acrobat;22.3.20282.0;Adobe Systems Incorporated\nmozjs17.x86_64;@rhel-7-server-rpms;17.0.0-20.el7\nPokerStars;3.0.0.658;PokerStars\nAcrobat  Distiller for Windows;10.1.16.13;Adobe Systems Incorporated.\nCorelDRAW Graphics Suite X6 - Writing Tools (x64);16.1;Corel Corporation\nTeamViewer;4.0;TeamViewer GmbH\nChromium;138.0.7176.0;The Chromium Authors\nABBYY FineReader 12 Corporate;12.1;ABBYY Production LLC\n1С:Предприятие 8 (8.3.20.1674);8.3.20.1674;1С-Софт\nPostman;9.9.3;Postman\nGeodeWPF;1.1.7168.6305;Golden Software, LLC\nplatform.client.java.app.cmc.webpath_bundles-4.0-ru-nu;14.2;SAP BusinessObjects\ngspell.x86_64;1.8.1-1.el8;@rhel-8-for-x86_64-appstream-rpms\nСПДС Стройплощадка 2021 x64 для AutoCAD;21.0;CSoft Development\nAdobe Acrobat;22.1.20142.0;Adobe Systems Incorporated\nshell_executor.exe;3.5.5030 (vvrao);Intel Corporation\nСПДС Стройплощадка 2021;21.0.3362;ООО Магма-Компьютер\nВЭД-Инфо;17.49;ООО «СТМ»\nAutoCAD;17.2.56.0;Autodesk, Inc\npgAdmin 4 version 8.2 (All users);8.2;The pgAdmin Development Team\nVMware Workstation;16.2.3;VMware, Inc.\nnanoCAD BIM СКС;24.0.5767.5767;Nanosoft Razrabotka\nIntel(R) Chipset Device Software;10.1;Intel(R) Corporationꢏ☀言HKEY_LOCAL_MACHINE\nAdobe Acrobat;22.3.20310.0;Adobe Systems Incorporated\nMozilla Firefox (x86 ru);141.0;Mozilla\nSkype;8.58;Skype Technologies S.A.\npciutils-libs.x86_64;3.5.1-3.el7;@rhel-7-server-rpms\nABBYY PDF Transformer;3.0.100.399;ABBYY\nMouseWare;8.21;Logitech Inc.\nMicrosoft Edge;1.3.185.27;Microsoft Corporation\nWindows Internet Explorer 10;10.00.9200.16438;Microsoft Corporation\n1C:Enterprise 8 Thin client (8.3.6.2041);8.3;1C\nAdobe Acrobat (64-bit);25.001;Adobe\nfly-admin-samba;1.5.13+ci4;Vladislav Mileshkin <support@rusbitech.ru>\nthink-cell;14.0.38.494;think-cell Operations GmbH\nHP Connection Optimizer;2.0;HP Inc\nthink-cell;14.0;think-cell Operations GmbH\nMozilla Firefox (x64 en-US);141.0;Mozilla\nglow;2.1.1;charmbracelet\nMicrosoft(R) Windows NT(R) Operating System;4.71.0728.0;Microsoft Corporation\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664䎗�　耀;12.0;Microsoft Corporation\nthink-cell;11.0.32.426;think-cell Operations GmbH\nAutoCAD;17.2.56.0;Autodesk, Inc.\nMicrosoft® Windows(TM) Operating System;3.10;Microsoft Corporation\nTeamViewer;13.1.3629.0;TeamViewer GmbH\nQGIS 3.10.12 'A Coruсa';3.10;QGIS Development Team\nMicrosoft® Windows® Operating System;10.0.19041.2180;Microsoft Corporation\nnanoCAD Отопление 20.0 x64;20.0;Nanosoft\nDr.Web (R);5.00.0.12170;Doctor Web, Ltd.\nnanoCAD BIM ОПС x64 23.0;23.0;OOO Nanosoft Razrabotka\nQGIS 3.10.12 'A Coruсa';3.10;QGIS Development Team\nVMware Workstation;4.5.2.8848;VMware, Inc.\nВЭД-Инфо;14.23;ООО «СТМ»\nGoogle Chrome;139.0;Google, Inc.\nnanoCAD BIM Вентиляция;22.0.5600.5600;Nanosoft\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nTeamViewer;15.1.3937.0;TeamViewer Germany GmbH\nIntel Rapid Storage Technology;17.2.8.1029;HP Inc.\nDr.Web ®;5.0.0.10200;Doctor Web, Ltd.\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nМойОфис Почта;2.8;(с) ООО «НОВЫЕ ОБЛАЧНЫЕ ТЕХНОЛОГИИ», 2013–2024\nYandex;1.6.2.855;YANDEX LLC\nK-Lite Codec Pack;17.6.8;KLCP\nMicrosoft Visual C++ 2013 Redistributable (x64) - 12.0.40664䈯帢⨀耀ᮈ梶᭤梶ᬼ梶;12.0;Корпорация Майкрософт\nnanoCAD Стройплощадка x64;22.0.3838.6048;ООО «Нанософт разработка»\nABBYY PDF Transformer 3.0;3.00;ABBYY\nQGIS 3.10.12 'A Coruсa';3.10;QGIS Development Team\nСБИС Плагин;23.7148;Tensor Company Ltd\nAutodesk Desktop App;8.2.0.34;Autodesk Inc.\nMicrosoft® Visual Studio®;16.8.30907.39;Microsoft Corporation\nfly-admin-driver;;Medvedev Dmitry <dmedvedev@astralinux.ru>\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664鷄䄩Ѐ耀;12.0;Microsoft Corporation\nCorelDRAW Graphics Suite X6 - PHOTO-PAINT (x64);16.1;Corel Corporation\nGeodeWPF;1.1.7168.6305;Golden Software, LLC\nvim-data.noarch * @updates * 2:9.1.016-1.el7.3;;\nAdobe Acrobat;7.0.0.0;Adobe Systems Incorporated\nlibqt4-dbus:amd64;4:4.8.7+dfsg-20astra1;Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\neltex-johnny * Victor Abarenov <victor.abarenov@eltex-co.ru> * 1.29-257;;\n1C:Предприятие 8.2 (x86-64) (8.2.19.130);8.2;1C\nKaspersky Embedded Systems Security;1.1.0.104;AO Kaspersky Lab\nnanoCAD BIM ОПС;23.0.5497.5497;Nanosoft Razrabotka\nlibwrap0:amd64;7.6.q-30;Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\nFileZilla;3.60.2;Tim Kosse\nlibbluray.x86_64 * @anaconda/7.4 * 0.2.3-5.el7;;\nAutodesk Windows Components for AutoCAD;3.0.267.0;Autodesk, Inc.\nchromium;138.0.7204.168;redsoft\nlibdjvulibre21:amd64;3.5.28-2+b1;Barak A. Pearlmutter <bap@debian.org>\nDisk Drill 4.4.613.0킦淩Ȁ蠀噼疴;4.4;CleverFiles\nВЭД-Инфо;16.63;ООО «СТМ»\nСПДС 25.0 x64;25.0;Нанософт разработка\nrubygem-diffy;3.4.2;Red Hat, Inc.\n1C:Enterprise 8 Thin client (8.3.15.1565);8.3;1C-Soft\npgAdmin 4 version 8.2;8.2;The pgAdmin Development Team\nСПДС Стройплощадка 2021 x64;21.0.3362;ООО Магма-Компьютер\nNode.js;18.20.2;Node.js\nnodejs;14.21.1;CentOS\nKaspersky Endpoint Security 11 для Windows;11.3.0.773;\"АО \"\"Лаборатория Касперского\"\"\"\nlibdrm.x86_64;2.4.103-1.el8;@rhel-8-for-x86_64-appstream-rpms\nMicrosoft® Windows® Operating System;10.0.19041.2180;Microsoft Corporation\nfuse-common;3.10.5;redsoft\nMicrosoft® Windows(TM) Operating System;3.10;Microsoft\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nКонфигуратор КСОДУ;1.2.3.16;Sum of the technologies\nTRACE MODE;5, 1, 5, 0;AdAstra Research Group\nПакет установки nanoCAD Облака точек 24.0;24.0.6451.4566;ООО «Нанософт разработка»\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nMicrosoft Visual Studio Setup;16.8.30717.126;Microsoft Corporation\nFineReader;6.0.0.568;ABBYY (BIT Software)\nPokerStars;3.0.0.658;PokerStars\n1C:Enterprise 8 Thin client (8.3.24.1691);8.3;1C-Soft\nAutodesk Windows Components;3.0.1.1;Autodesk, Inc.\nnodejs;18.20.1;RED SOFT\nTeamViewer;15.21.8.0;TeamViewer Germany GmbH\nplymouth.x86_64;0.8.9-0.34.20140113.el7;@InstallMedia-BaseOS7.9\nGeodeWPF;1.1.7168.6305;Golden Software, LLC\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nMicrosoft Edge;1.3.185.27;Microsoft Corporation\nPDF24 Creator;11.29.0;Geek Software GmbH\nthink-cell;14.0.38.522;think-cell Operations GmbH\nHP Connection Optimizer;2.0;HP Inc.\nopenjdk-11-jdk-headless;;OpenJDK Team <openjdk-11@packages.debian.org>\nTRACE MODE;5, 1, 5, 0;AdAstra Research Group, Ltd\nrubygem-diffy;3.4.2;Red Hat, Inc.\nVMware Workstation;12.5;VMware, Inc.\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nVMware Workstation;16.2.1;VMware, Inc.\nTeamViewer QS;15.11.6.0;TeamViewer\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nNode.js;14.21.3;Node.js Foundation\nMicrosoft Edge;1.3.185.27;Microsoft Corporation\nКомпоненты Контур.Экстерн (Администратор) 2.9.9.41;2.9;АО «ПФ «СКБ Контур»\nWindows® Internet Explorer;10.00.9200.16521;Microsoft Corporation\nVMware Workstation;16.0.0;VMware, Inc.\n1C Предприятие 7.7;77.27;\nСБИС Плагин;23.7148;Tensor Company Ltd\nnanoCAD BIM Электро;23.1.5734.5734;Nanosoft Razrabotka\nthink-cell;11.0.33.8;think-cell Operations GmbH\nABBYY FineReader 10 Professional Edition;10.501;ABBYY\nСПДС x64 25.0;25.0;Нанософт разработка\nK-Lite Codec Pack;17.6.8;KLCP\nlibXxf86misc.x86_64;@anaconda/7.6;1.0.3-7.1.el7\nnanoCAD BIM Вентиляция x64;25.0.12926.12926;Nanosoft\nplatform.client.java.app.cmc.webpath_bundles-4.0-ru-nu;14.2;SAP BusinessObjects\nplatform.client.java.app.cmc.webpath_bundles-4.0-ru-nu;14.2;SAP BusinessObjects\nДиаг.Плагин;3.0.27.957;АО ПФ СКБ Контур\nYandex;1.6.2.855;YANDEX LLC\nPostman;1.3;Alexey Popov (Ghost)\nVMware Workstation;12.5.7;VMware, Inc.\n1C:Enterprise 8.2 (8.2.18.61);8.2.18.61;1C\nAutodesk Desktop App;8.2.0.34;Autodesk, Inc.\nКомпоненты Контур.Экстерн;2.9.9.41;АО «ПФ «СКБ Контур»\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664�懹ഀ谀ဈ狐禐Ή禼ΉȀ;12.0;Microsoft Corporation\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664㬅؀蠀ᛨ橍ᛄ橍᚜橍\u0001;12.0;Microsoft Corporation\nAdobe Photoshop 2023;24.1;Adobe Inc.\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nvlc-plugin-video-output:amd64;3.0.21-0astra2+b2;Debian Multimedia Maintainers <debian-multimedia@lists.debian.org>\nPostman;11.27.3;Postman\nТИМ КРЕДО 3D ВЬЮВЕР;24.11;компания «Кредо-Диалог»\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.30501Ⱶ鐵؀谀ဈ溃弨Ϝ彤ϜȀ;12.0;Microsoft Corporation\nQGIS 3.10.12 'A Coruсa';3.10;QGIS Development Team\nAdobe Photoshop 2023;24.1;Adobe Systems Incorporated\nTRACE MODE;5, 1, 5, 0;AdAstrA Research Group, Ltd.\nKaspersky Endpoint Security 12 для Windows;12.3.0.493;АО Лаборатория Касперского\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\n1C:Enterprise 8.0;8.0.16.2;1C\nАДЕПТ: Проект;12.5.0.21;АДЕПТ\n1C:Enterprise 8.0;8.0.13;1C\nABBYY FineReader 11 Corporate Edition;11.11;ABBYY Production LLC\nFineReader;6.0.0.426;ABBYY (BIT Software)\nMozilla Firefox (x64 ru);141.0;Mozilla\nnanoCAD Отопление x64 20.0;20.0;Nanosoft\nМойОфис Почта 2.8 (x64 ru);2.8;ООО «НОВЫЕ ОБЛАЧНЫЕ ТЕХНОЛОГИИ»\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664涑Ɪ᐀耀;12.0;Microsoft Corporation\nKaspersky Embedded Systems Security for Windows;3.4.0.36;AO Kaspersky Lab\nСБИС Плагин;23.7148;Tensor Company Ltd\nglow;2.1.1;charmbracelet\nfuse-libs.x86_64 * @anaconda * 2.9.7-12.el8;;\n", "file": "04_Хроническая_форма_v3.csv"}, {"band": "Требуется срочное вмешательство", "tone": "#c0161d", "index": 19, "rows": 277, "csv": "Наименование ПО;Версия;Издатель\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nДрайверы Рутокен鳾ግⰀ谀☠摷\u0001;4.21;\"Компания \"\"Актив\"\"\"\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nMicrosoft Windows Desktop Runtime - 6.0.35 (x86)呥欇Ȁ谀\u0001耄D;6.0;Microsoft Corporation\nTeamViewer;4.0;TeamViewer GmbH\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664鷄䄩Ѐ耀;12.0;Microsoft Corporation\nAutodesk Windows Components for AutoCAD;3.0.267.0;Autodesk, Inc.\n1C:Enterprise 8.2 (8.2.18.61);8.2.18.61;1C\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664ဦĵ਀耀;12.0;Microsoft Corporation\nAdobe Acrobat;22.3.20310.0;Adobe Systems Incorporated\nTeamViewer QS;15.11.6.0;TeamViewer\nlibmodbus5:amd64;3.1.6-2.1+b1;SZ Lin (林上智) <szlin@debian.org>\n1C:Enterprise 8.2;8.2.14.540;1C\nAutoCAD;17.2.56.0;Autodesk\nNode.js;18.20.2;Node.js\nAdobe Acrobat;7.0.5.2005092300;Adobe Systems Incorporated\nMicrosoft Visual Studio Community;16.8.30907.101;Microsoft Corporation\nK-Lite Codec Pack;17.6.8;KLCP\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nPDF24 Creator;11.29.0;geek software GmbH\nТИМ КРЕДО 3D ВЬЮВЕР;24.11;компания «Кредо-Диалог»\nK-Lite Codec Pack;17.6.8;KLCP\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nVMware Workstation;4.5.2.8848;VMware, Inc.\nKaspersky Endpoint Agent;3.11.0.216;AO Kaspersky Lab\nВЭД-Склад (Диспетчер);2.09.20.0;\"ООО \"\"СТМ\"\"\"\nMozilla Firefox (x86 ru);141.0;Mozilla\nAdobe Acrobat;15.7.20033.133275;Adobe Systems Incorporated\nTeamViewer;15.21.6.0;TeamViewer Germany GmbH\nABBYY FineReader 12 Corporate;12.1;ABBYY Production LLC\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nAutodesk Desktop App;8.2.0.34;Autodesk\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nABBYY FineReader 11 Corporate Edition;11.11;ABBYY Production LLC\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.30501Ⱶ鐵؀谀ဈ溃弨Ϝ彤ϜȀ;12.0;Microsoft Corporation\nTeamViewer;15.73.5.0;TeamViewer Germany GmbH\nДрайверы Guardant;7.0;\"Компания \"\"Актив\"\"華䭐Ѐ言CurrentVersion\"\nK-Lite Codec Pack;17.6.8;KLCP\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nWindows® Internet Explorer;10.00.9200.16521;Microsoft Corporation\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nK-Lite Codec Pack;17.6.8;KLCP\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664䇯܀蠀ᛨ杄ᛄ杄᚜杄\u0001;12.0;Microsoft Corporation\nnanoCAD Отопление x64 20.0;20.0;Nanosoft\nMicrosoft Visual Studio Professional;16.8.31005.135;Microsoft Corporation\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nDisk Drill 4.4.613.0킦淩Ȁ蠀噼疴;4.4;CleverFiles\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nAutodesk Desktop App;8.2.0.34;Autodesk, Inc.\nnanoCAD BIM Вентиляция x64;25.0.12926.12926;Nanosoft\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664䨮갺㔀耀;12.0;Microsoft Corporation\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664�懹ഀ谀ဈ狐禐Ή禼ΉȀ;12.0;Microsoft Corporation\nMicrosoft® Office;15.0.0169.500;Microsoft Corporation\nAdobe Acrobat;7.0.0.0;Adobe Systems Incorporated\nМойОфис Почта;2.8;(с) ООО «НОВЫЕ ОБЛАЧНЫЕ ТЕХНОЛОГИИ», 2013–2024\nTeamViewer;15.1.3937.0;TeamViewer Germany GmbH\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nCorelDRAW Graphics Suite X6 - PHOTO-PAINT (x64);16.1;Corel Corporation\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nKaspersky Embedded Systems Security for Windows;3.3.0.87;AO Kaspersky Lab\nnanoCAD BIM Электро x64 23.1;23.1;OOO Nanosoft Razrabotka\nnodejs;18.20.1;RED SOFT\nKaspersky Embedded Systems Security for Windows;3.4.0.36;AO Kaspersky Lab\nMicrosoft Visual C++ 2013 Redistributable (x64) - 12.0.40664䈯帢⨀耀ᮈ梶᭤梶ᬼ梶;12.0;Корпорация Майкрософт\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nAutoCAD;17.2.56.0;Autodesk, Inc.\nKaspersky Endpoint Security 12 для Windows;12.3.0.493;\"АО \"\"Лаборатория Касперского\"\"\"\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nAutodesk Windows Components;3.0.1.1;Autodesk, Inc.\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664ӗᡯఀ耀;12.0;Microsoft Corporation\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nthink-cell;14.0.38.522;think-cell Operations GmbH\nVMware Workstation;16.2;VMware, Inc.\nPDF24 Creator;11.29.0;Geek Software GmbH\nInstallShield;24.0;Flexera\nAdobe Acrobat;2.1;Adobe Systems Incorporated\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nВЭД-Инфо;17.49;ООО «СТМ»\nVMware Workstation;12.5.7;VMware, Inc.\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nTRACE MODE;5, 1, 5, 0;AdAstra Research Group\nKaspersky Endpoint Security 11 для Windows;11.3.0.773;АО Лаборатория Касперского\nDr.Web ®;5.0.0.10200;Doctor Web, Ltd.\nABBYY FineReader 11 Corporate Edition;11.11;ABBYY\n1С:Предприятие 8 (8.3.20.1674);8.3.20.1674;1С-Софт\nChromium;138.0.7176.0;The Chromium Authors\nSkype, версия 8.58;8.58;Skype Technologies S.A.\nthink-cell;11.0.32.426;think-cell Operations GmbH\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664涑Ɪ᐀耀;12.0;Microsoft Corporation\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nWindows Internet Explorer 10;10.00.9200.16438;Microsoft Corporation\nthink-cell;14.0;think-cell Operations GmbH\nNode.js;14.21.3;Node.js Foundation\nIntel Rapid Storage Technology;17.2.8.1029;HP Inc\nTeamViewer;15.21.8.0;TeamViewer Germany GmbH\nДиаг.Плагин;3.0.27.957;АО ПФ СКБ Контур\nthink-cell;11.0.33.8;think-cell Operations GmbH\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nPostman;1.3;Alexey Popov (Ghost)\nthink-cell;7.0.24.170;think-cell Software GmbH\nТИМ КРЕДО ВЬЮВЕР;24.11;компания «Кредо-Диалог»\nFineReader;6.0.0.568;ABBYY (BIT Software)\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664휵犇ጀ耀;12.0;Microsoft Corporation\nВЭД-Инфо;16.63;ООО «СТМ»\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nK-Lite Codec Pack;17.6.8;KLCP\n1C:Enterprise 8 Thin client (8.3.24.1691);8.3;1C-Soft\nMozilla Firefox (x86 en-US);141.0;Mozilla\nCorelDRAW Graphics Suite X6 - Writing Tools (x64);16.1;Corel Corporation\nchromium;138.0.7204.168;redsoft\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nAdobe Photoshop 2023;24.1;Adobe Systems Incorporated\nDr.Web (R);5.00.0.12170;Doctor Web, Ltd.\nlibwrap0:amd64;7.6.q-30;Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\nMozilla Firefox (x64 en-US);141.0;Mozilla\nFileZilla;3.60.2;Tim Kosse\nKaspersky Endpoint Security 12 для Windows;12.3.0.493;АО Лаборатория Касперского\nMicrosoft Visual C++ 2012 Redistributable (x86) - 11.0.61030�ꨇᘀ谀ဈ慛唐͹啌͹Ȁ;11.0;Microsoft Corporation\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nKaspersky Endpoint Agent 3.11;3.11;\"АО \"\"Лаборатория Касперского\"\"\"\nVMware Horizon Client;8.10;VMware, Inc.勣쌤ࠀ谀⅘斩媀ͧ\nMouseWare;8.21;Logitech\nInstallShield;24.0;Flexera Software LLC\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nnanoCAD BIM Электро 23.1 x64;23.1;Nanosoft Razrabotka\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664헆픕ᰀ蠀ᛨ槤ᛄ槤᚜槤\u0001;12.0;Microsoft Corporation\nVMware Workstation;16.0.0;VMware, Inc.\nHP Connection Optimizer;2.0;HP Inc\nAdobe Acrobat;25.1.20623.0;Adobe Systems Incorporated\npostgrespro-std-14;14.6.1;Postgres Professional\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nK-Lite Codec Pack;17.6.8;KLCP\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\n1C:Предприятие 8.2 (8.2.19.106);8.2;1C\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nPostman;11.83.0;Postman\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nCorelDRAW Graphics Suite X6 - PHOTO-PAINT;16.1;Corel Corporation\n1C:Enterprise 8.0;8.0.16.2;1C\nMouseWare;8.21;Logitech, Inc.\nnanoCAD BIM Электро;23.1.5734.5734;Nanosoft Razrabotka\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nFileZilla 3.60.2;3.60.2;Tim Kosse\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664�▃Ḁ谀ဈ燸䫘ͻ䬔ͻȀ;12.0;Microsoft Corporation\nMicrosoft Windows Desktop Runtime - 5.0.17 (x86)롅뾩Ḁ谀\u0001耄D;5.0;Microsoft Corporation\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nMicrosoft Office;15.0.5337.1000;Microsoft Corporation\nAdobe Acrobat (64-bit);25.001;Adobe\nnanoCAD Стройплощадка 22.0 x64;22.0;Нанософт разработка\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nPostman;9.9.3;Postman\nTRACE MODE;5, 1, 5, 0;AdAstrA Research Group, Ltd.\npostgrespro-std-14-client;14.6.1;Postgres Professional\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nK-Lite Codec Pack;17.6.8;KLCP\n1С:Предприятие 8 (8.3.24.1548);8.3.24.1548;1С-Софт\nСПДС x64 25.0;25.0;Нанософт разработка\nlibdrm.x86_64;2.4.103-1.el8;@rhel-8-for-x86_64-appstream-rpms\nIntel(R) Chipset Device Software;10.1;Intel(R) Corporationꢏ☀言HKEY_LOCAL_MACHINE\nMicrosoft Visual Studio Setup;16.8.30717.126;Microsoft Corporation\nK-Lite Codec Pack;17.6.8;KLCP\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nABBYY FineReader 10 Professional Edition;10.501;ABBYY\nAdobe Photoshop 2023;24.1;Adobe Inc.\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nAdobe Acrobat;25.1.20623.0;Adobe\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nK-Lite Codec Pack;17.6.8;KLCP\nKaspersky Embedded Systems Security 2.0;2.0.0.388;AO Kaspersky Lab\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\n1C:Enterprise 8 Thin client (8.3.15.1565);8.3;1C-Soft\nMozilla Firefox (x64 ru);141.0;Mozilla\nFileZilla 3.60.1;3.60;Tim Kosse\nAcrobat  Distiller for Windows;10.1.16.13;Adobe Systems Incorporated.\nK-Lite Codec Pack;17.6.8;KLCP\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664煄㬀耀;12.0;Microsoft Corporation\n1С:Предприятие 8 (x86-64) (8.3.21.1607);8.3.21.1607;1С-Софт\n1C:Enterprise 8.2 (8.2.19.130);8.2;1C\nВЭД-Инфо;17.11;ООО «СТМ»\nAdobe Reader;7.0;Adobe Systems Inc\nnanoCAD BIM ОПС;23.0.5497.5497;Nanosoft Razrabotka\nMicrosoft® Windows(TM) Operating System;3.10;Microsoft Corporation\nK-Lite Codec Pack;17.6.8;KLCP\nK-Lite Codec Pack;17.6.8;KLCP\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nnanoCAD Отопление 20.0 x64;20.0;Nanosoft\nПрограммное обеспечение Intel® Chipset Device;10.1;Intel(R) Corporation띸㛙ἀ谀摐˕撠˕憨˕昈˕敨˕杰˕曐˕暨˕書˕\nAdobe Acrobat;25.1.20623.0;Adobe\nAdobe Photoshop 2023;24.1;Adobe\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nnanoCAD Стройплощадка x64;22.0.3838.6048;ООО «Нанософт разработка»\nAdobe Acrobat;22.1.20142.0;Adobe Systems Incorporated\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664⚕卸─耀;12.0;Microsoft Corporation\nK-Lite Codec Pack;17.6.8;KLCP\nK-Lite Codec Pack;17.6.8;KLCP\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nMicrosoft Visual C++ 2013 Redistributable (x64) - 12.0.40660Ᲊ矘ᤀ蠀ᾜ柙ὸ柙ὐ柙\u0002;12.0;Microsoft Corporation\n1C:Enterprise 8 Thin client (8.3.13.1809);8.3.13.1809;1C-Soft\n\"ImportExportDataRL,\n\u0001P\";;2024-05-15 19:17:50.71121\nCorelDRAW Graphics Suite X6 - Writing Tools;16.1;Corel Corporation\nthink-cell;1.17.980.0;think-cell Software GmbH\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nHP Connection Optimizer;2.0;HP Inc.\nВЭД-Инфо;14.23;ООО «СТМ»\nMicrosoft® Windows(TM) Operating System;3.10;Microsoft\nFineReader;6.0.0.426;ABBYY (BIT Software)\nPostman;11.27.3;Postman\nAutoCAD;17.2.56.0;Autodesk, Inc\nnanoCAD BIM ОПС x64 23.0;23.0;OOO Nanosoft Razrabotka\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664㬅؀蠀ᛨ橍ᛄ橍᚜橍\u0001;12.0;Microsoft Corporation\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\n1C:Предприятие 8.2 (x86-64) (8.2.19.130);8.2;1C\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664䎗�　耀;12.0;Microsoft Corporation\nMicrosoft ® Visual Studio ®;16.8.11214.1;Microsoft Corporation\nСПДС 25.0 x64;25.0;Нанософт разработка\nКонтур.Плагин;3.17.1.682;АО ПФ СКБ Контур\nHP Connection Optimizer;2.0;HP\nnanoCAD BIM Вентиляция;22.0.5600.5600;Nanosoft\nthink-cell;7.0.24.150;think-cell Software GmbH\nMicrosoft® Visual Studio®;16.8.30907.39;Microsoft Corporation\nK-Lite Codec Pack;17.6.8;KLCP\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664寉壚⸀耀;12.0;Microsoft Corporation\nnanoCAD BIM ОПС 23.0 x64;23.0;Nanosoft Razrabotka\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nДиаг.Плагин;3.0.27.957;\"АО \"\"ПФ \"\"СКБ Контур\"\"\"\nВЭД-Склад (Диспетчер);2.09.20.0;ООО СТМ\n1C Предприятие 7.7;77.27;\nМойОфис Почта 2.8 (x64 ru);2.8;ООО «НОВЫЕ ОБЛАЧНЫЕ ТЕХНОЛОГИИ»\nAutodesk Desktop App;8.2.0.34;Autodesk Inc.\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\n1C:Enterprise 8.0;8.0.13;1C\nnanoCAD BIM Вентиляция x64 24.1;24.1;Nanosoft Razrabotka\n1C Предприятие 7.7;77.25;\nVMware Workstation;16.2.3;VMware, Inc.\nGoogle Chrome;139.0;Google LLC\nGoogle Chrome;139.0;Google, Inc.\nAdobe Acrobat;22.3.20282.0;Adobe Systems Incorporated\nTRACE MODE;5, 1, 5, 0;AdAstra Research Group, Ltd\nSkype;8.58;Skype Technologies S.A.\nVMware Workstation;12.5;VMware, Inc.\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\n1C:Enterprise 8 Thin client (8.3.6.2041);8.3;1C\nKaspersky Endpoint Security 11 для Windows;11.3.0.773;\"АО \"\"Лаборатория Касперского\"\"\"\nAdobe Reader;7.0;Adobe Systems\nКонтур.Плагин;3.17.1.682;АО «ПФ «СКБ Контур»\nnodejs;14.21.1;CentOS\nVMware Workstation;16.2.1;VMware, Inc.\nIntel Rapid Storage Technology;17.2.8.1029;HP Inc.\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\nKaspersky Embedded Systems Security;1.1.0.104;AO Kaspersky Lab\nMouseWare;8.21;Logitech Inc.\nthink-cell;14.0.38.494;think-cell Operations GmbH\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\n", "file": "05_Требуется_срочное_вмешательство_v3.csv"}];

/* ---------- загрузка данных ---------- */

function showError(msg) { const e = $('#err'); e.textContent = msg; e.classList.add('on'); }
function clearError() { $('#err').classList.remove('on'); }

function setGoReady(on) {
  const b = $('#go');
  b.classList.toggle('is-disabled', !on);
  b.setAttribute('aria-disabled', on ? 'false' : 'true');
}

function ingest(text) {
  clearError();
  const parsed = parseInput(text);
  if (!parsed.rows.length) { showError('Не удалось прочитать ни одной строки. Проверьте файл.'); return; }
  if (parsed.rows.length > CONFIG.maxRows) {
    showError(`В файле ${parsed.rows.length.toLocaleString('ru')} строк. Возьмем первые ${CONFIG.maxRows.toLocaleString('ru')} — этого достаточно для диагноза.`);
    parsed.rows = parsed.rows.slice(0, CONFIG.maxRows);
  }
  STATE.rows = parsed.rows;
  STATE.cols = guessColumns(parsed.rows);
  fillSelects();
  $('#map').classList.add('on');
  setGoReady(true);
  $('#reset').style.display = '';
  $('#go').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function colLabel(i) {
  const c = STATE.cols;
  const head = c.header && c.header[i] ? String(c.header[i]).trim() : '';
  const sample = (c.body.find(r => String(r[i] ?? '').trim()) || [])[i] || '';
  const s = String(sample).trim().slice(0, 34);
  return `${head || 'Столбец ' + (i + 1)}${s ? ' — ' + s + (String(sample).length > 34 ? '…' : '') : ''}`;
}

function fillSelects() {
  const c = STATE.cols;
  const opts = (sel, cur, allowNone) => {
    sel.innerHTML = '';
    if (allowNone) { const o = document.createElement('option'); o.value = '-1'; o.textContent = '— нет такого столбца —'; sel.appendChild(o); }
    for (let i = 0; i < c.width; i++) {
      const o = document.createElement('option');
      o.value = String(i); o.textContent = colLabel(i);
      sel.appendChild(o);
    }
    sel.value = String(cur);
  };
  opts($('#cName'), c.name, false);
  opts($('#cVer'), c.version, true);
  opts($('#cPub'), c.publisher, true);
}

/* ---------- отрисовка ---------- */

/** Человеческая подпись версионной корзины: «8.0·u391» -> «8.0 обн. 391». */
function verLabel(v) {
  if (v === '∅') return 'без версии';
  return String(v)
    .replace(/·u(\d+)/, ' обн. $1')
    .replace(/·b([\d.]+)/, ' сборка $1')
    .replace(/·sp(\d)/, ' SP$1')
    .replace(/·(x64|x86|arm64)/, ' $1');
}

function tone(i) { return i >= 72 ? 'ok' : i >= 52 ? 'warn' : 'bad'; }
function toneColor(i) { return i >= 72 ? 'var(--ok)' : i >= 52 ? 'var(--warn)' : 'var(--bad)'; }
function toneBg(i) { return i >= 72 ? 'var(--ok-l)' : i >= 52 ? 'var(--warn-l)' : 'var(--bad-l)'; }

function gauge(index) {
  const LEN = 282.74; // π × 90
  const on = LEN * index / 100;
  return `<div class="gauge">
    <svg viewBox="0 0 212 132" width="212" height="132" aria-hidden="true">
      <path d="M16 116 A90 90 0 0 1 196 116" fill="none" stroke="#EAEDF1" stroke-width="16" stroke-linecap="round"/>
      <path d="M16 116 A90 90 0 0 1 196 116" fill="none" stroke="${toneColor(index)}" stroke-width="16"
            stroke-linecap="round" stroke-dasharray="${on.toFixed(1)} ${LEN}"/>
    </svg>
    <div class="val"><div class="num" style="color:${toneColor(index)}">${index}</div>
      <div class="of">ИНДЕКС ЧИСТОТЫ</div></div>
  </div>`;
}

function tile(n, label, sub, cls) {
  return `<div class="tile ${cls || ''}"><div class="n">${n}</div><div class="l">${label}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`;
}

function blockFold(bodyHtml, openText = 'Посмотреть подробнее', closeText = 'Скрыть') {
  return `<div class="block-fold">
    <button type="button" class="block-fold__btn" aria-expanded="false">
      <span class="block-fold__open">${openText}</span>
      <span class="block-fold__close">${closeText}</span>
      <svg class="block-fold__chev" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="block-fold__body" hidden>${bodyHtml}</div>
  </div>`;
}

function bindReportFolds(root) {
  if (!root || root.dataset.foldsBound === '1') return;
  root.dataset.foldsBound = '1';
  root.addEventListener('click', e => {
    const btn = e.target.closest('.block-fold__btn');
    if (!btn || !root.contains(btn)) return;
    const wrap = btn.closest('.block-fold');
    const body = wrap && wrap.querySelector('.block-fold__body');
    if (!body) return;
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    body.hidden = open;
    wrap.classList.toggle('is-open', !open);
  });
}

function renderFindings(a) {
  let h = '';

  /* разнописания */
  if (a.spellGroups.length) {
    const items = [];
    for (const g of a.spellGroups.slice(0, 25)) {
      for (const b of g.buckets) {
        if (b.excess <= 0) continue;
        items.push(`<div class="find">
          <div class="k">ВЕРСИЯ ${esc(verLabel(b.ver)).toUpperCase()} · ${b.forms.length} ${plural(b.forms.length, 'написание', 'написания', 'написаний')} одной записи</div>
          <div class="forms">${b.forms.map(f => `<span class="chip dup">${esc(f)}</span>`).join('')}</div></div>`);
      }
    }
    const body = `${items.join('')}
      ${a.spellGroups.length > 25 ? `<div class="find"><div class="k">…и еще ${a.spellGroups.length - 25} ${plural(a.spellGroups.length - 25, 'продукт', 'продукта', 'продуктов')}</div></div>` : ''}`;
    h += `<div class="card sect">
      <h3>Одно и то же ПО записано по-разному</h3>
      <div class="sh">Одинаковый продукт, одинаковая версия — но в базе это разные записи. Для отчета по лицензиям каждая из них считается отдельно.</div>
      ${blockFold(body, 'Посмотреть подробнее')}
    </div>`;
  }

  /* издатели */
  if (a.vendorGroups.length) {
    const body = `${a.vendorGroups.slice(0, 15).map(v => `<div class="find">
        <div class="forms">${v.forms.map(f => `<span class="chip dup">${esc(f)}</span>`).join('')}</div></div>`).join('')}
      ${a.vendorGroups.length > 15 ? `<div class="find"><div class="k">…и еще ${a.vendorGroups.length - 15}</div></div>` : ''}`;
    h += `<div class="card sect">
      <h3>Один издатель — несколько написаний</h3>
      <div class="sh">Пока издатель пишется по-разному, любая группировка по вендору и любой запрос «что у нас от этого производителя» дает неполный ответ.</div>
      ${blockFold(body, 'Посмотреть подробнее')}
    </div>`;
  }

  /* Блок «один продукт в нескольких версиях» здесь намеренно отсутствует.
     Без эталонного каталога отличить разные версии одного продукта от разных
     продуктов нельзя: AutoCAD 2019 и AutoCAD 2022, Visual C++ 2013 и 2015-2022
     по одному наименованию неразличимы. Этот вывод делается во втором акте,
     где опорой служит каталог, а не догадка. */

  /* дефекты */
  const jb = Object.entries(a.junkBreakdown).sort((x, y) => y[1] - x[1]);
  if (jb.length) {
    h += `<div class="card sect">
      <h3>Дефекты записей</h3>
      <div class="sh">Строки, которые не сопоставятся ни с одним справочником, пока их не почистить.</div>
      <div class="scroll"><table>
        <thead><tr><th>Что не так</th><th class="num">Строк</th></tr></thead>
        <tbody>${jb.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${v}</td></tr>`).join('')}</tbody></table></div>
      <div class="find"><div class="k">ПРИМЕРЫ</div><div class="forms">
        ${a.junkItems.slice(0, 6).map(i => `<span class="chip dup">${esc(i.name.slice(0, 70))}</span>`).join('')}</div></div>
    </div>`;
  }

  /* шум */
  const nb = Object.entries(a.noiseBreakdown).sort((x, y) => y[1] - x[1]);
  if (nb.length) {
    h += `<div class="card sect">
      <h3>Не подлежит лицензированию</h3>
      <div class="sh">Эти строки занимают место в отчетах и в голове у аналитика, но лицензий не требуют. Их нужно отсекать до начала учета, а не после.</div>
      <div class="scroll"><table>
        <thead><tr><th>Категория</th><th class="num">Строк</th></tr></thead>
        <tbody>${nb.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${v}</td></tr>`).join('')}</tbody></table></div>
    </div>`;
  }

  return h;
}

function methodology(a) {
  const w = a.weights, r = a.ratios;
  const line = (label, ratio, weight) =>
    `<tr><td>${label}</td><td class="num">${(ratio * 100).toFixed(1)}%</td><td class="num">×${weight}</td><td class="num">−${(ratio * weight).toFixed(1)}</td></tr>`;
  return `<details class="method">
    <summary>Как считается индекс чистоты? Открытая методика</summary>
    <div class="body">
      <p style="margin-bottom:12px">Мы не просим верить на слово. Индекс — это 100 минус штрафы по шести показателям. Веса подобраны нами и заданы явно, чтобы вы могли с ними спорить.</p>
      <div class="scroll"><table class="method-table">
        <thead><tr><th>Показатель</th><th class="num">Доля</th><th class="num">Вес</th><th class="num">Штраф</th></tr></thead>
        <tbody>
          ${line('Разнописания и полные дубли', r.spell, w.spell)}
          ${line('Записи без версии', r.missingVer, w.missingVer)}
          ${line('Версия в неразборчивом формате', r.messyVer, w.messyVer)}
          ${line('Дефекты записи', r.junk, w.junk)}
          ${line('Разнобой в написании издателя', r.vendor, w.vendor)}
          ${line('Строки вне лицензирования', r.noise, w.noise)}
        </tbody>
      </table></div>
      <p style="margin-top:14px">Что инструмент делает: убирает из наименования версию, разрядность, язык, скобочные хвосты и служебные слова, после чего сравнивает то, что осталось. Совпавшие записи с <b>одинаковой версией</b> считаются разнописанием; записи с <b>разными версиями</b> разнописанием не считаются — <code>AutoCAD 2019</code> и <code>AutoCAD 2022</code> это разные версии одного продукта, а не дубль.</p>
      <p style="margin-top:10px">Чего инструмент <b>не</b> делает: не сопоставляет ваши записи с эталонным каталогом ПО и не определяет модель лицензирования. Это уже работа «Призмы данных» — и как раз ее мы разбираем на третий день марафона.</p>
    </div>
  </details>`;
}

function render(a) {
  const compression = a.productsN ? (a.rowsN / a.productsN) : 1;
  const hrsLong = m => {
    const h = m / 60;
    if (h < 1) {
      const mm = Math.round(m);
      return `${mm} ${plural(mm, 'минута', 'минуты', 'минут')}`;
    }
    if (h < 10) return `${h.toFixed(1).replace('.', ',')} часа`;
    const hh = Math.round(h);
    return `${hh} ${plural(hh, 'час', 'часа', 'часов')}`;
  };
  const hrsShort = m => {
    const h = m / 60;
    return h < 1 ? `${Math.round(m)} мин` : h < 10 ? `${h.toFixed(1).replace('.', ',')} ч` : `${Math.round(h)} ч`;
  };

  const html = `
  <div class="card verdict">
    ${gauge(a.index)}
    <div>
      <span class="dx-tag" style="background:${toneBg(a.index)};color:${toneColor(a.index)}">Диагноз поставлен</span>
      <h2>${esc(a.diag.t)}</h2>
      <p>${esc(a.diag.d)}</p>
      <div class="cost">
        Мы разобрали <b>${a.rowsN.toLocaleString('ru')}</b> ${plural(a.rowsN, 'строку', 'строки', 'строк')} и нашли среди них
        <b>${a.productsN.toLocaleString('ru')}</b> ${plural(a.productsN, 'реальный продукт', 'реальных продукта', 'реальных продуктов')}.
        Если бы аналитик сводил это вручную, у него ушло бы примерно <b>${hrsLong(a.manualMinutes)}</b>.
        <label style="display:block;margin-top:10px;font-size:13.5px">
          А если во всей вашей базе
          <input id="scaleN" type="number" min="1" step="1000" value="${a.rowsN}"
                 style="width:120px;padding:5px 8px;border:1px solid var(--line);border-radius:7px;font:inherit;font-size:13.5px">
          <span id="scaleWord">${plural(a.rowsN, 'запись', 'записи', 'записей')}</span>, это <b id="scaleOut">${hrsShort(a.manualMinutes)}</b>.
        </label>
      </div>
    </div>
  </div>

  <div class="tiles">
    ${tile(a.rowsN.toLocaleString('ru') + ' → ' + a.productsN.toLocaleString('ru'), 'Строк превращается в продуктов', 'сжатие в ' + compression.toFixed(1).replace('.', ',') + ' раза', '')}
    ${tile(a.spellExcess + a.exactDup, 'Лишних форм записи', a.spellGroups.length + ' ' + plural(a.spellGroups.length, 'продукт затронут', 'продукта затронуто', 'продуктов затронуто'), a.spellExcess ? 'acc-bad' : 'acc-ok')}
    ${tile(a.vendorGroups.length, 'Издателей с разнобоем', 'один вендор записан по-разному', a.vendorGroups.length ? 'acc-warn' : 'acc-ok')}
    ${tile(a.missingVer, 'Записей без версии', a.messyVer ? '+' + a.messyVer + ' с неразборчивой' : 'версия проставлена везде', a.missingVer ? 'acc-warn' : 'acc-ok')}
    ${tile(a.junkItems.length, 'Строк с дефектами', 'битая кодировка, пути, GUID', a.junkItems.length ? 'acc-bad' : 'acc-ok')}
    ${tile(a.noiseItems.length, 'Строк вне лицензирования', 'библиотеки, драйверы, патчи', a.noiseItems.length ? 'acc-warn' : 'acc-ok')}
  </div>

  ${renderFindings(a)}

  <div class="card sect">${methodology(a)}</div>

  ${STATE.recon ? renderReconcile(STATE.recon, CORE) : ''}

  <div class="cta" id="cta">
    <div>
      <h3>Это была диагностика. Дальше — лечение</h3>
      <p>Инструмент выше показал, <b>что</b> с базой не так. Он сознательно не делает главного — не сопоставляет ваши записи с эталонным каталогом ПО и не определяет модель лицензирования. Это и есть работа «Призмы данных», и ее мы разбираем на марафоне.</p>
      <ul>
        <li>Выписка по вашему файлу в PDF — с находками и порядком действий</li>
        <li>Чек-лист «10 симптомов того, что базе нужна нормализация»</li>
        <li>Место в «Клинике чистых данных» — 4 дня, бесплатно</li>
      </ul>
    </div>
    <form class="form" id="lead" novalidate>
      <input id="lName" placeholder="Фамилия и имя" autocomplete="name">
      <input id="lCompany" placeholder="Компания и должность" autocomplete="organization">
      <input id="lEmail" type="email" placeholder="Рабочая почта" autocomplete="email">
      <div class="err" id="lErr"></div>
      <button type="submit" class="btn btn-p">Получить выписку</button>
      <div class="note">Отправляем только выписку и материалы клиники. Ваш файл при этом никуда не уходит — он все это время оставался в браузере.</div>
    </form>
  </div>

  <div class="row" style="justify-content:center;margin-top:16px">
    <button class="btn btn-s" id="print">Сохранить результат в PDF</button>
  </div>`;

  const out = $('#out');
  out.innerHTML = html;
  out.classList.add('on');
  bindReportFolds(out);

  /* пересчет масштаба */
  const inp = $('#scaleN'), o = $('#scaleOut');
  if (inp) inp.addEventListener('input', () => {
    const n = Math.max(1, +inp.value || a.rowsN);
    o.textContent = hrsShort(a.manualMinutes * n / a.rowsN);
    const w = document.getElementById('scaleWord');
    if (w) w.textContent = plural(n, 'запись', 'записи', 'записей');
  });

  $('#print').addEventListener('click', () => window.print());
  $('#lead').addEventListener('submit', onLead);
  out.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- заявка ---------- */

async function onLead(e) {
  e.preventDefault();
  const name = $('#lName').value.trim(), comp = $('#lCompany').value.trim(), mail = $('#lEmail').value.trim();
  const err = $('#lErr');
  const fail = m => { err.textContent = m; err.style.display = 'block'; };
  err.style.display = 'none';

  if (name.split(/\s+/).filter(w => w.length > 1).length < 2) return fail('Укажите фамилию и имя.');
  if (comp.length < 3) return fail('Укажите компанию и должность.');
  if (!/^[^@\s]+@[^@\s]+\.[a-zа-я]{2,}$/i.test(mail)) return fail('Проверьте адрес почты.');

  const a = STATE.result;
  const payload = {
    name, company: comp, email: mail,
    index: a.index, diagnosis: a.diag.t,
    rows: a.rowsN, products: a.productsN,
    spellExcess: a.spellExcess, multiVersion: a.multiVersion.length,
    licensable: STATE.recon ? STATE.recon.licensable : null,
    recognized: STATE.recon ? STATE.recon.known : null,
    missingVersion: a.missingVer, junk: a.junkItems.length, noise: a.noiseItems.length,
    source: 'ОАД'
  };

  if (CONFIG.leadEndpoint) {
    try {
      await fetch(CONFIG.leadEndpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
    } catch (_) { /* прототип не должен падать из-за сети */ }
  }

  $('#lead').outerHTML = `<div class="form done">
    <div style="font-size:34px;line-height:1;margin-bottom:12px">✓</div>
    <h3 style="font-size:18px;margin-bottom:8px">Записали</h3>
    <p style="font-size:14px">Выписку и материалы отправим на ${esc(mail)}.</p>
    <a class="btn btn-p" style="margin-top:16px;text-decoration:none" href="${CONFIG.clinicUrl}">Войти в клинику</a>
  </div>`;
}

/* ---------- события ---------- */

$('#drop').addEventListener('click', () => $('#file').click());
$('#drop').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#file').click(); } });
['dragenter', 'dragover'].forEach(ev => $('#drop').addEventListener(ev, e => { e.preventDefault(); $('#drop').classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => $('#drop').addEventListener(ev, e => { e.preventDefault(); $('#drop').classList.remove('over'); }));

$('#drop').addEventListener('drop', e => {
  const f = e.dataTransfer.files[0];
  if (f) readFile(f);
});
$('#file').addEventListener('change', e => { if (e.target.files[0]) readFile(e.target.files[0]); });

function readFile(f) {
  if (f.size > 30 * 1024 * 1024) return showError('Файл больше 30 МБ. Возьмите выгрузку поменьше или вставьте столбец через буфер обмена.');
  const r = new FileReader();
  r.onload = () => {
    $('#drop').querySelector('b').textContent = f.name;
    ingest(r.result);
  };
  r.onerror = () => showError('Не удалось прочитать файл.');
  r.readAsText(f, 'utf-8');
}

let pasteTimer;
$('#paste').addEventListener('input', e => {
  clearTimeout(pasteTimer);
  const v = e.target.value;
  pasteTimer = setTimeout(() => { if (v.trim().length > 10) ingest(v); }, 400);
});

/* кнопки образцов */
(function () {
  const box = $('#demos');
  if (!box) return;
  box.innerHTML = DEMOS.map((d, i) => `<button class="demo-b" data-i="${i}">
      <i style="background:${d.tone}1a;color:${d.tone}">${d.index}</i>
      <span class="demo-b__txt"><b>${esc(d.band)}</b><span class="n">${d.rows} строк</span></span>
    </button>`).join('');
  box.addEventListener('click', e => {
    const b = e.target.closest('.demo-b'); if (!b) return;
    const d = DEMOS[+b.dataset.i];
    $('#paste').value = d.csv;
    ingest(d.csv);
    $('#go').click();
  });
})();

$('#reset').addEventListener('click', () => {
  STATE = { rows: null, cols: null, result: null, recon: null };
  $('#paste').value = ''; $('#file').value = '';
  $('#map').classList.remove('on');
  $('#out').classList.remove('on'); $('#out').innerHTML = '';
  setGoReady(false); $('#reset').style.display = 'none';
  $('#drop').querySelector('b').textContent = 'Перетащите файл или нажмите для выбора';
  clearError();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

$('#go').addEventListener('click', () => {
  if ($('#go').classList.contains('is-disabled') || !STATE.rows) return;
  const c = STATE.cols;
  c.name = +$('#cName').value;
  c.version = +$('#cVer').value;
  c.publisher = +$('#cPub').value;
  if (c.name === c.version || c.name === c.publisher) return showError('Наименование и версия (или издатель) не могут быть одним столбцом.');
  clearError();
  $('#go').textContent = 'Считаем…'; setGoReady(false);
  setTimeout(() => {
    try {
      STATE.result = analyze(STATE.rows, c);
      STATE.recon = (typeof CORE !== 'undefined' && CORE) ? reconcile(STATE.result, CORE) : null;
      render(STATE.result);
    } catch (ex) {
      showError('Не получилось разобрать эти данные: ' + ex.message);
    }
    $('#go').textContent = 'Поставить диагноз'; setGoReady(true);
  }, 30);
});

