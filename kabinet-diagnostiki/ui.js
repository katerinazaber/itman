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

let STATE = { rows: null, cols: null, result: null, recon: null, demo: false };

/* ---------- образцы ----------
   Пять выгрузок, по одной на каждый диагноз. Каждая строка в них —
   подлинная запись из реальной инвентаризации; ни одно наименование,
   версия или издатель не выдуманы. Подставляются на сборке. */
const DEMOS = [{"band": "Дублитоз средней тяжести", "tone": "#c07800", "index": 61, "rows": 288, "csv": "Наименование ПО;Версия;Издатель\ndataservices.embeddedhelp-4.0-en-64;14.2.13.2467;SAP BusinessObjects\nAutoCAD;17.2.56.0;Autodesk, Inc\n1C Предприятие 7.7;77.27;\nYandexTelemost;1.0.35.1174;Yandex\nRealtek Audio Codec Driver;6.0.1.7116;Lenovo Group Limited\n1C:Enterprise 8 Thin client (8.3.24.1691);8.3;1C-Soft\nTeamViewer;15.21.6.0;TeamViewer Germany GmbH\nTeamViewer;15.73.5.0;TeamViewer Germany GmbH\nHP Recovery Image & Software Download Tool (ThinUpdate) 64-b;2.2.9;Hewlett-Packard Company\nnanoCAD BIM Электро;23.1.5734.5734;Nanosoft Razrabotka\nWindows Terminal;1.18.231009002-preview;Microsoft Corporation\nnodejs;18.20.1;RED SOFT\nGoogle Chrome Installer;98.0.4758.82;Google LLC\nhppSendFaxM1522;003.000;Название организации\nHeroes of Might and Magic V (обновление 1.3);1.3;Nival Interactive\nnanoCAD BIM ОПС 23.0 x64;23.0;Nanosoft Razrabotka\nMicrosoft SQL Server 2016;13.2.5888.11;Microsoft Corporation\n1C:Enterprise 8.2 (8.2.18.61);8.2.18.61;1C\nAdobe Photoshop 2023;24.1;Adobe Systems Incorporated\nQEMU guest agent;102.7;RedHat\nnanoCAD Отопление x64 20.0;20.0;Nanosoft\nCorel Graphics - Windows Shell Extension 32 Bit Keys;19.0;Corel Corporation\nChromium Installer;141.0.7379.0;The Chromium Authors\nnanoCAD Отопление 20.0 x64;20.0;Nanosoft\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664涑Ɪ᐀耀;12.0;Microsoft Corporation\n1С:Предприятие 8 (8.3.20.1674);8.3.20.1674;1С-Софт\nKaspersky Embedded Systems Security for Windows;3.4.0.36;AO Kaspersky Lab\nTeamViewer;15.1.3937.0;TeamViewer Germany GmbH\nSysinternals Whois;1.14;Sysinternals - www.sysinternals.com\niwl6000g2a-firmware.noarch;18.168.6.1-99.el8.1;@anaconda\nMicrosoft® Visual Studio®;16.8.30907.39;Microsoft Corporation\nDisk Drill 4.4.613.0킦淩Ȁ蠀噼疴;4.4;CleverFiles\nlibqt4-dbus:amd64;4:4.8.7+dfsg-20astra1;Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\nlibqt5sql5-sqlite:amd64;Debian;*\nnanoCAD BIM Вентиляция x64;25.0.12926.12926;Nanosoft\nplatform.services.java.publishingservice-4.0-core-nu;14.3.4.5181;SAP BusinessObjects\n1C:Enterprise 8 Thin client (8.3.15.1565);8.3;1C-Soft\nnanoCAD Стройплощадка 22.0 x64;22.0;Нанософт разработка\nMicrosoft Windows Desktop Runtime - 6.0.35 (x86)呥欇Ȁ谀\u0001耄D;6.0;Microsoft Corporation\nArcGIS Desktop Background Geoprocessing 10.8.1;10.8.1.14362;Esri\nFileZilla;3.60.2;Tim Kosse\nlibdrm.x86_64;2.4.103-1.el8;@rhel-8-for-x86_64-appstream-rpms\nМойОфис Почта 2.8 (x64 ru);2.8;ООО «НОВЫЕ ОБЛАЧНЫЕ ТЕХНОЛОГИИ»\nThunderbolt(TM) Software;17.4.78.15;Intel Corporation\nlibxcb-xparsec:amd64;1.14-2astra.se10;Debian X Strike Force <debian-x@lists.debian.org>\nMicrosoft ® Visual Studio ®;16.8.11214.1;Microsoft Corporation\nABBYY FineReader 12 Corporate;12.1;ABBYY Production LLC\nHP Connection Optimizer;2.0;HP Inc.\nPostman;1.3;Alexey Popov (Ghost)\nViewer;3.5.5401.27093;SpaceTeamLab, Ltd.\nKasten K10 Plug-In UI extension for Veeam Backup & Replication;12.0.1.4;Veeam Software Group GmbH\nAD LDS Instance VMwareVCMSDS;;Microsoft Corporation\nTeamViewer;15.21.8.0;TeamViewer Germany GmbH\nGeodeWPF;1.1.7168.6305;Golden Software, LLC\nfly-admin-driver;;Medvedev Dmitry <dmedvedev@astralinux.ru>\nSAS.Planet;1.0.0.0;SAS Group\nMicrosoft® Windows(TM) Operating System;3.10;Microsoft\nTeamViewer QS;15.11.6.0;TeamViewer\nUnrealEngine3;1.0.4589.30310;Epic Games, Inc.\nlibwrap0:amd64;7.6.q-30;Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\n1C:Enterprise 8.2 (8.2.19.130);8.2;1C\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664鷄䄩Ѐ耀;12.0;Microsoft Corporation\nplatform.services.java.publishingservice-4.0-core-nu;14.3.4.5181;SAP BusinessObjects\nMicrosoft (R) Visual Studio;6.00.9437;Microsoft Corporation\nExeInfo;1.01;NirSoft\nnanoCAD BIM Электро x64 23.1;23.1;OOO Nanosoft Razrabotka\nAdobeLogCollectorTool;5.0.0.61;Adobe Systems Incorporated\nsle-module-desktop-applications-release;15.7;SUSE LLC <https://www.suse.com/>\nNI Portable Configuration for 64 Bit Windows 19.5.0;19.50;National Instruments\nlibcephfs2;19.2.0-0ubuntu0.24.04.2;Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>\nshell_executor.exe;3.5.5030 (vvrao);Intel Corporation\nLicense Helper;9.4.1.3102;VanDyke Software, Inc.\nglow;2.1.1;charmbracelet\nMicrosoft Project профессиональный 2013;15.0;Microsoft Corporation\nYandex;1.6.2.855;YANDEX LLC\nMozilla Firefox (x86 en-US);141.0;Mozilla\nNVIDIA-SMI 461.09;8.17.14.6109;NVIDIA Corporation\npostgrespro-std-14-client;14.6.1;Postgres Professional\nthink-cell;11.0.33.8;think-cell Operations GmbH\nVMware Workstation;16.2.3;VMware, Inc.\nlibbluray.x86_64 * @anaconda/7.4 * 0.2.3-5.el7;;\nDr.Web (R);5.00.0.12170;Doctor Web, Ltd.\nWindows Internet Explorer 10;10.00.9200.16438;Microsoft Corporation\ngnome-keyring-lang;40.0;SUSE LLC <https://www.suse.com/>\nnanoCAD BIM Вентиляция x64 24.1;24.1;Nanosoft Razrabotka\n1C:Enterprise 8 Thin client (8.3.6.2041);8.3;1C\nVMware Workstation;16.2.1;VMware, Inc.\nKaspersky Endpoint Agent 3.11;3.11;\"АО \"\"Лаборатория Касперского\"\"\"\nMouseWare;8.21;Logitech\nplymouth.x86_64;0.8.9-0.34.20140113.el7;@InstallMedia-BaseOS7.9\nAdobe Acrobat (64-bit);25.001;Adobe\nABBYY FineReader 11 Corporate Edition;11.11;ABBYY Production LLC\nAdobe Acrobat;2.1;Adobe Systems Incorporated\nYandexTelemost;1.0.35.1174;Yandex\nMicrosoft® Windows(TM) Operating System;3.10;Microsoft Corporation\nlibdjvulibre21:amd64;3.5.28-2+b1;Barak A. Pearlmutter <bap@debian.org>\nAutodesk Desktop App;8.2.0.34;Autodesk Inc.\nkbd;2.0.4-4;Console utilities maintainers <pkg-kbd-devel@lists.alioth.debian.org>\n1C:Enterprise 8.2;8.2.14.540;1C\nMicrosoft SQL Server 2014;12.2.5000.0;Microsoft Corporation\nTRACE MODE;5, 1, 5, 0;AdAstra Research Group\nMSS;23.1.1.85;Keysystems\nQGIS 3.10.12 'A Coruсa';3.10;QGIS Development Team\nEFA;7.4.2.66;Broadcom\nКонфигуратор КСОДУ;1.2.3.16;Sum of the technologies\nthink-cell;14.0.38.522;think-cell Operations GmbH\nAutoCAD;17.2.56.0;Autodesk, Inc.\nQGIS 3.10.12 'A Coruсa';3.10;QGIS Development Team\nVMware Workstation;16.2;VMware, Inc.\nAutodesk Windows Components for AutoCAD;3.0.267.0;Autodesk, Inc.\nPDF24 Creator;11.29.0;geek software GmbH\nnanoCAD BIM СКС;24.0.5767.5767;Nanosoft Razrabotka\nMicrosoft Office;15.0.5337.1000;Microsoft Corporation\nQueue.Kiosk;1.0.0;Queue.Kiosk\nurw-base35-p052-fonts;20170801;CentOS\ncredo_transcor Credo Framework Application;2024.1.1.254;КРЕДО-ДИАЛОГ\ncogl.x86_64 * @anaconda/7.6 * 1.22.2-2.el7;;\njson-c.x86_64 * @rhel-8-for-x86_64-baseos-rpms * 0.13.1-0.4.el8;;\nKaspersky Endpoint Security for Windows;11.15;\nAdobe Reader and Acrobat Manager;1.5.5.0;Adobe Systems Incorporated\nAdobe Acrobat;25.1.20623.0;Adobe\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664�懹ഀ谀ဈ狐禐Ή禼ΉȀ;12.0;Microsoft Corporation\nАДЕПТ: Проект;12.5.0.21;АДЕПТ\nplatform.client.java.app.cmc.webpath_bundles-4.0-ru-nu;14.2;SAP BusinessObjects\ngrub2.x86_64;@InstallMedia-BaseOS7.9;1:2.02-0.87.el7\nMKVToolNix;44.0.0;Moritz Bunkus\nAshampoo Burning Studio 10 Portable;0.0.0.0;PortableAppZ.blogspot.com\nTRACE MODE;5, 1, 5, 0;AdAstra Research Group, Ltd\nethtool.x86_64;@anaconda;2:4.8-7.el7\nAdobe Acrobat;7.0.5.2005092300;Adobe Systems Incorporated\nMicrosoft Visual C++ 2012 Redistributable (x86) - 11.0.61030�ꨇᘀ谀ဈ慛唐͹啌͹Ȁ;11.0;Microsoft Corporation\nKaspersky Embedded Systems Security;1.1.0.104;AO Kaspersky Lab\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.30501Ⱶ鐵؀谀ဈ溃弨Ϝ彤ϜȀ;12.0;Microsoft Corporation\nnanoCAD Стройплощадка x64;22.0.3838.6048;ООО «Нанософт разработка»\nKaspersky Endpoint Agent;3.11.0.216;AO Kaspersky Lab\nSecurity Update for Microsoft Excel 2013 (KB5002384) 64-Bit Edition;;MicrosoftInstallDate    :\nТИМ КРЕДО 3D ВЬЮВЕР;24.11;компания «Кредо-Диалог»\nSkype;8.58;Skype Technologies S.A.\nCorelDRAW Graphics Suite X6 - PHOTO-PAINT;16.1;Corel Corporation\nnanoCAD BIM Электро 23.1 x64;23.1;Nanosoft Razrabotka\nAutoPlay Menu Builder;8.0;\"ООО \"\"ВЕГА ИНСТРУМЕНТС\"\"\"\nPostman;11.83.0;Postman\nMozilla Firefox (x64 ru);141.0;Mozilla\nfuse-libs.x86_64 * @anaconda * 2.9.7-12.el8;;\nFileZilla 3.60.1;3.60;Tim Kosse\nTRACE MODE;5, 1, 5, 0;AdAstrA Research Group, Ltd.\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664㬅؀蠀ᛨ橍ᛄ橍᚜橍\u0001;12.0;Microsoft Corporation\n1C:Enterprise 8.0;8.0.16.2;1C\nVMware Workstation;4.5.2.8848;VMware, Inc.\nCorelDRAW Graphics Suite X6 - Writing Tools;16.1;Corel Corporation\nnanoCAD BIM ОПС x64 23.0;23.0;OOO Nanosoft Razrabotka\nMicrosoft Visual Studio Setup;16.8.30717.126;Microsoft Corporation\nAggreGate 6.33.01;6.33.01;Tibbo Systems\nMozilla Firefox (x86 ru);141.0;Mozilla\n1C:Enterprise 8 Thin client (8.3.13.1809);8.3.13.1809;1C-Soft\nMKVToolNix;44.0.0;Moritz Bunkus\nNVIDIA-SMI 516.94;8.17.15.1694;NVIDIA Corporation\nthink-cell;14.0.38.494;think-cell Operations GmbH\nfuse-common;3.10.5;redsoft\ncredo_transcor Credo Framework Application;2024.1.1.254;КРЕДО-ДИАЛОГ\n1C:Предприятие 8.2 (x86-64) (8.2.19.130);8.2;1C\nRStudio;1,1,423,0;RStudio, Inc.\nPostman;9.9.3;Postman\nnanoCAD BIM ОПС;23.0.5497.5497;Nanosoft Razrabotka\n7-Zip SFX;1.6.0.2712;Oleg N. Scherbakov\nSystem software for Windows 2.8.7;2.8.7;CUTA\nAdobe Acrobat;22.3.20310.0;Adobe Systems Incorporated\nnanoCAD BIM Вентиляция;22.0.5600.5600;Nanosoft\nWindows® Internet Explorer;10.00.9200.16521;Microsoft Corporation\nnanoCAD BIM СКС x64 24.0;24.0;OOO Nanosoft Razrabotka\nlibXxf86misc.x86_64;@anaconda/7.6;1.0.3-7.1.el7\n1С:Предприятие 8 (8.3.24.1548);8.3.24.1548;1С-Софт\nSmartSan;1, 0, 0, 1;QLogic\nMicrosoft® Office;15.0.0169.500;Microsoft Corporation\nAdobe Acrobat;7.0.0.0;Adobe Systems Incorporated\nSAS.Planet;1.0.0.0;SAS Group\nAdobe Acrobat;22.3.20282.0;Adobe Systems Incorporated\nK-Lite Codec Pack;17.6.8;KLCP\nТИМ КРЕДО ВЬЮВЕР;24.11;компания «Кредо-Диалог»\nAdobe Acrobat;22.1.20142.0;Adobe Systems Incorporated\nAdobe Acrobat;15.7.20033.133275;Adobe Systems Incorporated\npython3-libvirt;4.5.0;Red Hat, Inc.\nAltiris Service Control Task Agent;6.0;Altiris Inc.\nKaspersky Embedded Systems Security 2.0;2.0.0.388;AO Kaspersky Lab\nFoxit ConnectedPDF Popup Notice Windows.;9.7.0.29430;Foxit Software Inc.\nСБИС Плагин;23.7148;Tensor Company Ltd\nglow;2.1.1;charmbracelet\nDIALux evo;3.2.0.0;DIAL GmbH\nIGCC;1.100.5131.0;Intel Corporation\nmozjs17.x86_64;@rhel-7-server-rpms;17.0.0-20.el7\nСПДС x64 25.0;25.0;Нанософт разработка\nglusterfs-client-xlators.x86_64 * @baseos * 6.0-56.4.el8;;\nNode.js;14.21.3;Node.js Foundation\nVMware Workstation;12.5;VMware, Inc.\nMicrosoft PowerBI Desktop (x64);2.118.621.0;Microsoft Corporation\nPokerStars;3.0.0.658;PokerStars\nAdobe Photoshop 2023;24.1;Adobe Inc.\nMicrosoft(R) Windows NT(R) Operating System;4.71.0728.0;Microsoft Corporation\nIntel(R) Common User Interface;6.15.100.7859;Intel Corporation\nfly-admin-samba;1.5.13+ci4;Vladislav Mileshkin <support@rusbitech.ru>\nHP Connection Optimizer;2.0;HP\nAutodesk Desktop App;8.2.0.34;Autodesk, Inc.\neltex-johnny * Victor Abarenov <victor.abarenov@eltex-co.ru> * 1.29-257;;\nMozilla Firefox (x64 en-US);141.0;Mozilla\nLinkRelevanceMonitor;1.5.0+4345dd0.4345dd0dab968c5af8209f4bed1830b4cc3c5f8c;ConsultantPlus\nSAP Front-End Setup for the Windows(R) Environment;2008, 0, 0, 200;SAP AG\nnanoCAD BIM СКС 24.0 x64;24.0;Nanosoft Razrabotka\nFileZilla 3.60.2;3.60.2;Tim Kosse\nAdobe LiveCycle Designer;11, 0, 8, 20180110, 1, 931507;Adobe Systems Incorporated\nСПДС 25.0 x64;25.0;Нанософт разработка\nCorelDRAW Graphics Suite X6 - PHOTO-PAINT (x64);16.1;Corel Corporation\nopenjdk-11-jdk-headless;;OpenJDK Team <openjdk-11@packages.debian.org>\nMicrosoft SQL Server;14.0.1016.246;Microsoft Corporation\nFineReader;6.0.0.426;ABBYY (BIT Software)\nAggreGate 6.33.01;6.33.01;Tibbo Systems\nABBYY FineReader 10 Professional Edition;10.501;ABBYY\nIntel(R) Chipset Device Software;10.1;Intel(R) Corporationꢏ☀言HKEY_LOCAL_MACHINE\nVMware Workstation;12.5.7;VMware, Inc.\nAutodesk Windows Components;3.0.1.1;Autodesk, Inc.\nMicrosoft Visual Studio Community;16.8.30907.101;Microsoft Corporation\nAdobe Photoshop 2023;24.1;Adobe\nsolar-api-gateway;;dozor-support@solarsecurity.ru\nNetworkManager-libnm.x86_64;1:1.32.10-4.el8;@rhel-8-for-x86_64-baseos-rpms\npostgrespro-std-14;14.6.1;Postgres Professional\nthink-cell;14.0;think-cell Operations GmbH\nplatform.services.java.publishingservice-4.0-core-nu;14.3.4.5181;SAP BusinessObjects\ntesthost.arm64;17.14.0-preview-25117-01;Microsoft Corporation\nMicrosoft Visual C++ 2013 Redistributable (x86) - 12.0.40664䎗�　耀;12.0;Microsoft Corporation\nlibselinux-python;2.5;Red Hat, Inc.\nМойОфис Почта;2.8;(с) ООО «НОВЫЕ ОБЛАЧНЫЕ ТЕХНОЛОГИИ», 2013–2024\nXerox WorkCentre 3335;1.00 (21;Xerox Corporation\npciutils-libs.x86_64;3.5.1-3.el7;@rhel-7-server-rpms\nVisual Studio Code;1.100.0;Microsoft Corporation\nUnrealEngine3;1.0.4589.30310;Epic Games, Inc.\nHP Connection Optimizer;2.0;HP Inc\nchromium;138.0.7204.168;redsoft\nNI Portable Configuration for 64 Bit Windows 19.5.0;19.50;National Instruments\nthink-cell;7.0.24.170;think-cell Software GmbH\nNode.js;18.20.2;Node.js\ntp.gzip-1.2.3-core-32;14.2.4.2649;SAP BusinessObjects\nMouseWare;8.21;Logitech Inc.\nthink-cell;11.0.32.426;think-cell Operations GmbH\nVMware Workstation;16.0.0;VMware, Inc.\n1C Предприятие 7.7;77.25;\nKaspersky Embedded Systems Security for Windows;3.3.0.87;AO Kaspersky Lab\nvim-data.noarch * @updates * 2:9.1.016-1.el7.3;;\nMicrosoft® Windows® Operating System;10.0.19041.2180;Microsoft Corporation\nABBYY FineReader 11 Corporate Edition;11.11;ABBYY\nAutoCAD;17.2.56.0;Autodesk\nAcrobat  Distiller for Windows;10.1.16.13;Adobe Systems Incorporated.\nFlash OS images to SD cards and USB drives, safely and easily.;2.1.2;Balena Ltd. <hello@balena.io>\nJava(TM) Platform SE 20.0.1;20.0.1.0;Oracle Corporation\nima-evm-utils.x86_64 * @anaconda * 1.3-4.el7;;\nnode-validate-npm-package-name;3.0.0-1;Debian Javascript Maintainers <pkg-javascript-devel@lists.alioth.debian.org>\nДрайверы Рутокен鳾ግⰀ谀☠摷\u0001;4.21;\"Компания \"\"Актив\"\"\"\nconnectivity.connectionserver.drivers.db2.odbc.config-4.0-ru-nu;14.2.4.2410;SAP BusinessObjects\nclickhouse-odbc;;root <root@astra>\nFineReader;6.0.0.568;ABBYY (BIT Software)\nTeamViewer;4.0;TeamViewer GmbH\nLogTransport Application;8.1.0.19.48545;Adobe Systems Incorporated\nAutodesk Desktop App;8.2.0.34;Autodesk\nthink-cell;1.17.980.0;think-cell Software GmbH\nAshampoo Burning Studio 10 Portable;0.0.0.0;PortableAppZ.blogspot.com\ngspell.x86_64;1.8.1-1.el8;@rhel-8-for-x86_64-appstream-rpms\nthink-cell;7.0.24.150;think-cell Software GmbH\nlibkf5activities5:amd64;5.104.0-1+b2;Debian Qt/KDE Maintainers <debian-qt-kde@lists.debian.org>\nSkype, версия 8.58;8.58;Skype Technologies S.A.\nPDF24 Creator;11.29.0;Geek Software GmbH\nCorelDRAW Graphics Suite X6 - Writing Tools (x64);16.1;Corel Corporation\nMouseWare;8.21;Logitech, Inc.\nMicrosoft Project профессиональный 2013;15.0;Microsoft Corporation\nDr.Web ®;5.0.0.10200;Doctor Web, Ltd.\nEpson Event Manager;2, 0, 0, 0;SEIKO EPSON Corporation\nChromium;138.0.7176.0;The Chromium Authors\nMicrosoft Edge;1.3.185.27;Microsoft Corporation\nMicrosoft Visual Studio Professional;16.8.31005.135;Microsoft Corporation\nrubygem-diffy;3.4.2;Red Hat, Inc.\nvlc-plugin-video-output:amd64;3.0.21-0astra2+b2;Debian Multimedia Maintainers <debian-multimedia@lists.debian.org>\nHP Install;6.9.0.24630;HP Inc.\n1C:Enterprise 8.0;8.0.13;1C\n1С:Предприятие 8 (x86-64) (8.3.21.1607);8.3.21.1607;1С-Софт\nPostman;11.27.3;Postman\n\"ImportExportDataRL,\n\u0001P\";;2024-05-15 19:17:50.71121\n1C:Предприятие 8.2 (8.2.19.106);8.2;1C\nnodejs;14.21.1;CentOS\nNetworkManager-tui.x86_64;1:1.30.0-10.el8_4;@rhel-8-for-x86_64-baseos-rpms\nsystem-config-printer-libs.noarch * @anaconda/7.6 * 1.4.1-21.el7;;\nCrystalCPUID;4, 15, 2, 0;Crystal Dew World\n", "file": "03_Дублитоз_средней_тяжести_v3.csv"}];

/* ---------- загрузка данных ---------- */


function setGoReady(on) {
  const b = $('#go');
  if (!b) return;
  b.classList.toggle('is-disabled', !on);
  b.setAttribute('aria-disabled', on ? 'false' : 'true');
}

function showError(msg) { const e = $('#err'); e.textContent = msg; e.classList.add('on'); }
function clearError() { $('#err').classList.remove('on'); }

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
  const R = 118, CX = 145, CY = 138;
  const LEN = Math.PI * R;
  const on = LEN * Math.max(0, Math.min(100, index)) / 100;
  const left = CX - R, right = CX + R;
  return `<div class="gauge gauge-arc">
    <svg viewBox="0 0 290 168" width="290" height="168" aria-hidden="true">
      <path d="M${left} ${CY} A${R} ${R} 0 0 1 ${right} ${CY}" fill="none" stroke="#E4EAF1" stroke-width="20" stroke-linecap="round"/>
      <path d="M${left} ${CY} A${R} ${R} 0 0 1 ${right} ${CY}" fill="none" stroke="var(--red)" stroke-width="20"
            stroke-linecap="round" stroke-dasharray="${on.toFixed(1)} ${LEN.toFixed(2)}"/>
    </svg>
    <div class="val">
      <div class="num">${index}<span class="pct">%</span></div>
      <div class="of">ИНДЕКС ЧИСТОТЫ БАЗЫ
        <a class="gauge-info" href="#rx-method" title="Открытая методика" aria-label="Как считается индекс чистоты базы">!</a>
      </div>
    </div>
  </div>`;
}

function indexStatus(index) {
  if (index >= 72) return { title: 'В норме', sub: 'База в хорошем состоянии', cls: 'ok' };
  if (index >= 52) return { title: 'На грани', sub: 'Нормализация желательна', cls: 'warn' };
  return { title: 'Ниже нормы', sub: 'Рекомендуется нормализация', cls: 'bad' };
}

function diagTitleHtml(t) {
  const s = String(t || '');
  const pairs = [
    [/^Дублитоз\s+(.+)$/i, m => ['Дублитоз', m[1]]],
    [/^Легкая форма\s+(.+)$/i, m => ['Легкая форма', m[1]]],
    [/^Хроническая\s+(.+)$/i, m => ['Хроническая', m[1]]],
    [/^Требуется срочное\s+(.+)$/i, m => ['Требуется срочное', m[1]]],
    [/^Практически\s+(.+)$/i, m => ['Практически', m[1]]]
  ];
  for (const [re, fn] of pairs) {
    const m = s.match(re);
    if (m) {
      const [main, accent] = fn(m);
      return `<span class="rx-diag-main">${esc(main)}</span> <span class="rx-diag-accent">${esc(accent)}</span>`;
    }
  }
  return `<span class="rx-diag-main">${esc(s)}</span>`;
}

function tile(n, label, sub, cls) {
  return `<div class="tile ${cls || ''}"><div class="n">${n}</div><div class="l">${label}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`;
}

const whrs = m => { const h = m / 60;
  return h < 1 ? `${Math.round(m)} мин` : h < 10 ? `${h.toFixed(1).replace('.', ',')} ч` : `${Math.round(h)} ч`; };

const pain = (what, spend) => `<div class="pain">
  <div>${what}</div>
  ${spend ? `<div class="money">${spend.map(([k, v, cls]) =>
    `<span class="mchip ${cls}"><i>${k}</i>${v}</span>`).join('')}</div>` : ''}
</div>`;

const PRISM_LOGO = 'data:image/png;base64,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';
const prism = html => `<div class="prism">
  <img class="prism-logo" src="${PRISM_LOGO}" alt="Призма данных" width="150">
  <div>${html}</div>
</div>`;
const CM = (typeof CORE !== 'undefined' && CORE && CORE.meta) ? CORE.meta : null;
const nfmt = n => Number(n).toLocaleString('ru');

const ICO = {
  dup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 4h7l3 3v13H8V4z"/><path d="M15 4v3h3"/><path d="M11 11h4M11 15h4"/></svg>',
  vendor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="9" cy="8" r="2.5"/><circle cx="16" cy="9" r="2"/><path d="M4.5 18c.5-2.5 2.4-4 4.5-4s4 1.5 4.5 4"/><path d="M13 18c.3-1.8 1.5-3 3-3 1.2 0 2.2.7 2.7 2"/></svg>',
  ver: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 8l-3 4 3 4M16 8l3 4-3 4M13 6l-2 12"/></svg>',
  junk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 4L3.5 19h17L12 4z"/><path d="M12 10v4"/><circle cx="12" cy="16.5" r=".8" fill="currentColor" stroke="none"/></svg>',
  noise: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 4h7l3 3v13H8V4z"/><path d="M15 4v3h3"/><circle cx="12" cy="14" r="3.2"/><path d="M9.8 11.8l4.4 4.4"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.2 6.2l1.6 1.6M16.2 16.2l1.6 1.6M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6"/></svg>',
  steth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M6 4H4m16 0h-2"/><circle cx="18" cy="18" r="2.5"/><path d="M18 15.5V12a4 4 0 0 0-4-4"/></svg>',
  pulse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12h3l2-5 3 10 2-5h6"/></svg>',
  coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5c.6-1 1.5-1.5 2.5-1.5s2 .6 2 1.8c0 2.2-4 1.4-4 3.6 0 1 .8 1.6 2 1.6s1.8-.4 2.4-1.2"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19h16M7 16V9m5 7V5m5 11v-4"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 8v5"/><circle cx="12" cy="16.5" r=".8" fill="currentColor"/><path d="M10.2 4.5h3.6L19 19H5L10.2 4.5z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  chev: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3.5L10.5 8 6 12.5"/></svg>'
};

function rxImpact(items) {
  return `<div class="rx-impact">${items.map(([ico, title, text]) =>
    `<div class="rx-impact__i"><span class="rx-impact__ico" aria-hidden="true">${ico}</span>
      <div><b>${title}</b><p>${text}</p></div></div>`).join('')}</div>`;
}

function rxSolve(text) {
  return `<div class="rx-solve">
    <div class="rx-solve__h"><span class="rx-solve__ok" aria-hidden="true">${ICO.check}</span><b>Как это решается?</b></div>
    <p>${text}</p>
    <a class="btn btn-p rx-solve__cta" href="#rx-step2">Узнать больше о нормализации →</a>
  </div>`;
}

function rxPanelHead(title, badge, id) {
  return `<div class="rx-panel__head">
    <div class="rx-panel__title">${esc(title)} <span class="rx-badge">${badge}</span></div>
    <button type="button" class="rx-collapse" data-rx-close="${id}">Свернуть</button>
  </div>`;
}

let RXSEQ = 0;
function xtable(head, rows, preview, moreLabel) {
  const id = 'x' + (++RXSEQ);
  const rest = rows.slice(preview);
  return `<div class="scroll"><table class="rx-table">${head}
      <tbody>${rows.slice(0, preview).join('')}</tbody>
      ${rest.length ? `<tbody class="xmore" id="${id}" hidden>${rest.join('')}</tbody>` : ''}
    </table></div>
    ${rest.length ? `<button type="button" class="xtoggle" data-x="${id}" data-n="${rest.length}">${moreLabel || ('Показать еще ' + rest.length.toLocaleString('ru'))}</button>` : ''}`;
}

function panelSpell(a) {
  const rows = [];
  for (const g of a.spellGroups.slice(0, 40)) {
    for (const b of g.buckets) {
      if (b.excess <= 0) continue;
      const canon = b.forms.slice().sort((x, y) => y.length - x.length)[0] || g.title;
      b.forms.forEach((f, i) => {
        rows.push(`<tr><td class="num">${rows.length + 1}</td>
          <td class="raw">${esc(f)}</td>
          <td>${i === 0 ? esc(canon) : '<span class="dim">→ то же</span>'}</td>
          <td class="num">${b.members.filter(m => m.name.trim() === f).length || 1}</td></tr>`);
      });
    }
  }
  const n = a.spellExcess + a.exactDup;
  return `${rxPanelHead('Лишние формы записи', `${nfmt(n)} ${plural(n, 'запись', 'записи', 'записей')}`, 'spell')}
    ${rxImpact([
      [ICO.warn, 'Чем опасно', `Оценка лицензионного соответствия строится на учетных позициях. ${nfmt(n)} ${plural(n, 'лишняя форма', 'лишние формы', 'лишних форм')} уйдут в учет как отдельные позиции — потребность завысится.`],
      [ICO.clock, 'Трудозатраты на исправление', `${whrs(a.spellGroups.length * 3)} на сведение групп — и снова при каждой выгрузке.`],
      [ICO.coin, 'Влияние на деньги', `Бюджет закладывается на позиции, которых в парке нет, а реальная нехватка прав остается скрытой.`]
    ])}
    <div class="rx-panel__grid">
      <div>
        <h4>Примеры найденных разнописаний</h4>
        ${rows.length ? xtable('<thead><tr><th>#</th><th>Вариант в вашей базе</th><th>Сводится к</th><th class="num">Строк</th></tr></thead>', rows, 5, `Показать все ${rows.length.toLocaleString('ru')} вариантов`) : '<p class="dim">Примеров нет</p>'}
      </div>
      <div>
        <h4>Затронутые продукты</h4>
        <ul class="rx-side">
          ${a.spellGroups.slice(0, 8).map(g => `<li><span>${esc((g.title || '').slice(0, 42))}</span><b>${g.spellExcess}</b></li>`).join('')}
        </ul>
      </div>
    </div>
    ${rxSolve('Написания сводятся к одной учетной позиции автоматически при каждой загрузке — потребление считается по продуктам, а не по строкам реестра.')}`;
}

function panelVendor(a) {
  const primary = a.vendorGroups[0];
  const rows = primary ? primary.forms.map((f, i) => `<tr>
      <td class="num">${i + 1}</td>
      <td class="raw">${esc(f)}</td>
      <td>${esc(primary.key === '(пусто)' ? '—' : primary.key)}</td>
      <td class="num">—</td></tr>`) : [];
  const others = a.vendorGroups.slice(1, 9);
  return `${rxPanelHead('Разнобой в издателях', `${nfmt(a.vendorGroups.length)} ${plural(a.vendorGroups.length, 'издатель', 'издателя', 'издателей')}`, 'vendor')}
    ${rxImpact([
      [ICO.warn, 'Чем опасно', `Правообладатель — единица договора. Пока он пишется по-разному, любой срез «что у нас от этого производителя» неполный — риск недоучета и переплаты.`],
      [ICO.clock, 'Трудозатраты на исправление', `${whrs(a.vendorGroups.length * 2)} на сведение написаний к одной карточке вендора.`],
      [ICO.coin, 'Влияние на деньги', `Доля отечественного ПО и структура парка по вендорам считаются от неполной группировки.`]
    ])}
    <div class="rx-panel__grid">
      <div>
        <h4>Примеры найденных вариантов написания</h4>
        ${rows.length ? xtable('<thead><tr><th>#</th><th>Вариант в вашей базе</th><th>Нормализованное имя</th><th class="num">Строк</th></tr></thead>', rows, 5, primary && primary.forms.length > 5 ? `Показать все ${primary.forms.length} вариантов` : '') : '<p class="dim">Примеров нет</p>'}
      </div>
      <div>
        <h4>То же самое встречается у других издателей</h4>
        <ul class="rx-side">
          ${others.map(v => `<li><span>${esc(v.key)}</span><b>${v.forms.length}</b></li>`).join('') || '<li class="dim">Других групп нет</li>'}
        </ul>
      </div>
    </div>
    ${rxSolve('Издатель сводится к единой карточке вендора со страной производителя — группировка по правообладателю и срез по импортозамещению собираются из каталога.')}`;
}

function panelMissing(a) {
  return `${rxPanelHead('Версии потерялись', `${nfmt(a.missingVer)} ${plural(a.missingVer, 'запись', 'записи', 'записей')}`, 'missing')}
    ${rxImpact([
      [ICO.warn, 'Чем опасно', `Без версии нельзя понять, какая лицензия нужна: право на использование конкретной сборки дает артикул, а не факт установки.`],
      [ICO.clock, 'Трудозатраты', a.messyVer ? `Плюс ${nfmt(a.messyVer)} с неразборчивой версией — их тоже придется разбирать.` : 'Версию нужно добирать из других источников или переустанавливать агент.'],
      [ICO.coin, 'Влияние на деньги', `Нельзя проверить соответствие закупок установленным версиям — ни upgrade, ни downgrade.`]
    ])}
    <p class="rx-panel__note">Во втором шаге версии уточняются по эталонному каталогу там, где запись опознана.</p>
    ${rxSolve('Каталог подставляет каноническую версию и редакцию для опознанных позиций — отчет строится на учетных полях, а не на пустых ячейках инвентаря.')}`;
}

function panelJunk(a) {
  const jb = Object.entries(a.junkBreakdown).sort((x, y) => y[1] - x[1]);
  const rows = jb.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${v}</td></tr>`);
  return `${rxPanelHead('Ошибки в данных', `${nfmt(a.junkItems.length)} ${plural(a.junkItems.length, 'строка', 'строки', 'строк')}`, 'junk')}
    ${rxImpact([
      [ICO.warn, 'Чем опасно', `<b>${nfmt(a.junkItems.length)}</b> ${plural(a.junkItems.length, 'строка', 'строки', 'строк')} не пройдет нормализацию: опознаваемого наименования нет. Под битой строкой может стоять коммерческий продукт.`],
      [ICO.clock, 'Трудозатраты на исправление', `${whrs(a.junkItems.length * 1)} на разбор — и заново в каждой выгрузке, пока не устранен источник.`],
      [ICO.coin, 'Влияние на деньги', `Слепая зона в расчете прав: установка в парке есть, а в отчете ее нет.`]
    ])}
    ${rows.length ? xtable('<thead><tr><th>Что не так</th><th class="num">Строк</th></tr></thead>', rows, 6) : ''}
    <div class="forms" style="margin-top:12px">${a.junkItems.slice(0, 6).map(i => `<span class="chip dup">${esc(i.name.slice(0, 70))}</span>`).join('')}</div>
    ${rxSolve('Такие записи отделяются на входе и не попадают в лицензионный отчет — собираются конечным списком на разбор.')}`;
}

function panelNoise(a) {
  const nb = Object.entries(a.noiseBreakdown).sort((x, y) => y[1] - x[1]);
  const rows = nb.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${v}</td></tr>`);
  const share = a.rowsN ? (a.noiseItems.length / a.rowsN * 100).toFixed(0) : 0;
  return `${rxPanelHead('Лишние строки', `${nfmt(a.noiseItems.length)} ${plural(a.noiseItems.length, 'строка', 'строки', 'строк')}`, 'noise')}
    ${rxImpact([
      [ICO.warn, 'Чем опасно', `<b>${nfmt(a.noiseItems.length)}</b> из ${nfmt(a.rowsN)} (${share}%) — библиотеки, драйверы, патчи. Они занимают отчеты, но лицензий не требуют.`],
      [ICO.clock, 'Трудозатраты', `${whrs(Math.round(a.noiseItems.length * 0.5))} на разбор того, что учитывать не нужно.`],
      [ICO.chart, 'Влияние на управление', `Метрики вроде стоимости ПО на рабочее место считаются от разной базы — сравнивать периоды не на чем.`]
    ])}
    ${rows.length ? xtable('<thead><tr><th>Категория</th><th class="num">Строк</th></tr></thead>', rows, 8) : ''}
    ${rxSolve(`Периметр задает каталог: тип лицензирования проставлен у ${CM ? nfmt(CM.libApps) : '324 590'} эталонных продуктов.`)}`;
}

function panelManual(a) {
  return `${rxPanelHead('Ручная работа', whrs(a.manualMinutes), 'manual')}
    ${rxImpact([
      [ICO.warn, 'Что это значит', `Свести найденное вручную — примерно <b>${whrs(a.manualMinutes)}</b> работы аналитика на этом объеме выгрузки.`],
      [ICO.clock, 'Из чего складывается', `${a.spellGroups.length} ${plural(a.spellGroups.length, 'группа', 'группы', 'групп')} разнописаний × 3 мин + ${a.vendorGroups.length} издателей × 2 мин + ${a.junkItems.length} дефектов × 1 мин.`],
      [ICO.coin, 'Повторяемость', `Инвентаризация выгружается регулярно — без нормализации эти часы тратятся снова и снова.`]
    ])}
    ${rxSolve('В «Призме данных» нормализация выполняется при каждой загрузке без участия человека — экономия повторяется цикл за циклом.')}`;
}

function renderFindings(a) { return ''; }

function methodology(a) {
  const w = a.weights, r = a.ratios;
  const line = (label, ratio, weight) =>
    `<tr><td>${label}</td><td class="num">${(ratio * 100).toFixed(1)}%</td><td class="num">×${weight}</td><td class="num">−${(ratio * weight).toFixed(1)}</td></tr>`;
  return `<details class="rx-method" id="rx-method">
    <summary>Открытая методика</summary>
    <div class="body">
      <p style="margin-bottom:12px">Индекс — это 100 минус штрафы по шести показателям. Веса заданы явно, чтобы с ними можно было спорить.</p>
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
      <p style="margin-top:14px">Что инструмент делает: убирает из наименования версию, разрядность, язык, скобочные хвосты и служебные слова, после чего сравнивает то, что осталось. Совпавшие записи с <b>одинаковой версией</b> считаются разнописанием; записи с <b>разными версиями</b> разнописанием не считаются.</p>
      <p style="margin-top:10px">Чего инструмент <b>не</b> делает: не сопоставляет ваши записи с эталонным каталогом ПО и не определяет модель лицензирования. Это работа «Призмы данных».</p>
    </div>
  </details>`;
}

function renderSymptoms(a) {
  const spellN = a.spellExcess + a.exactDup;
  const manualN = Math.max(0, Math.round(a.manualMinutes));
  const cards = [
    { id: 'spell', n: spellN, title: 'Лишние формы записи', sub: 'Одно и то же ПО записано по-разному', ico: ICO.dup, on: !!spellN, panel: panelSpell },
    { id: 'vendor', n: a.vendorGroups.length, title: 'Разнобой в издателях', sub: 'Один издатель указан разными способами', ico: ICO.vendor, on: !!a.vendorGroups.length, panel: panelVendor },
    { id: 'missing', n: a.missingVer, title: 'Версии потерялись', sub: 'Для этих записей не указана версия ПО', ico: ICO.ver, on: !!a.missingVer, panel: panelMissing },
    { id: 'junk', n: a.junkItems.length, title: 'Ошибки в данных', sub: 'Есть неполные или некорректные записи', ico: ICO.junk, on: !!a.junkItems.length, panel: panelJunk },
    { id: 'noise', n: a.noiseItems.length, title: 'Лишние строки', sub: 'Записи, которые не относятся к лицензируемому ПО', ico: ICO.noise, on: !!a.noiseItems.length, panel: panelNoise },
    { id: 'manual', n: manualN, title: 'Ручная работа', sub: 'Столько раз данные придется проверять вручную', ico: ICO.hand, on: manualN > 0, panel: panelManual }
  ];

  const grid = cards.map(c => `<button type="button" class="rx-sym${c.on ? '' : ' is-ok'}" data-rx="${c.id}" ${c.on ? '' : 'disabled'}>
      <span class="rx-sym__top">
        <span class="rx-sym__ico" aria-hidden="true">${c.ico}</span>
        <span class="rx-sym__n">${nfmt(c.n)}</span>
      </span>
      <span class="rx-sym__t">${c.title}</span>
      <span class="rx-sym__s">${c.sub}</span>
      <span class="rx-sym__more">${c.on ? `Подробнее <i aria-hidden="true">${ICO.chev}</i>` : 'В норме'}</span>
    </button>`).join('');

  const panels = cards.filter(c => c.on).map(c =>
    `<div class="rx-panel" id="rx-panel-${c.id}" hidden data-rx-panel="${c.id}">${c.panel(a)}</div>`).join('');

  return `<section class="rx-symptom">
    <div class="rx-symptom__head">
      <div>
        <h3 class="rx-h">Симптомы диагноза</h3>
        <p class="rx-sh">Вот что мы нашли в вашей базе. Нажмите «Подробнее», чтобы разобраться.</p>
      </div>
    </div>
    <div class="rx-sym-grid">${grid}</div>
    <div class="rx-panels">${panels}</div>
  </section>`;
}

function render(a) {
  RXSEQ = 0;

  const html = `
  <div class="rx">

  <section class="rx-hero">
    <div class="rx-hero__gauge">
      ${gauge(a.index)}
    </div>
    <div class="rx-hero__diag">
      <span class="dx-tag">
        <span class="dx-tag__ico" aria-hidden="true">${ICO.pulse}</span> Диагноз поставлен
      </span>
      <h2>${diagTitleHtml(a.diag.t)}</h2>
      <p class="rx-hero__copy">Мы разобрали <b>${nfmt(a.rowsN)}</b> ${plural(a.rowsN, 'строку', 'строки', 'строк')} и нашли в них
        <b>${nfmt(a.productsN)}</b> ${plural(a.productsN, 'реальный продукт', 'реальных продукта', 'реальных продуктов')}.
        ${esc(a.diag.d)}</p>
    </div>
    <div class="rx-hero__effort">
      <div class="rx-effort">
        <span class="rx-effort__ico" aria-hidden="true">${ICO.clock}</span>
        <p>Чтобы свести такое количество данных вручную, аналитику нужно <b class="rx-effort__time">${whrs(a.manualMinutes)} работы.</b></p>
      </div>
      <div class="rx-scalebox">
        <div class="rx-scalebox__line">А если во всей вашей базе
          <input id="scaleN" type="number" min="1" step="1000" value="${a.rowsN}">
        </div>
        <div class="rx-scalebox__line">
          <span id="scaleWord">${plural(a.rowsN, 'запись', 'записи', 'записей')}</span> — это
          <b id="scaleOut" class="rx-scalebox__out">${whrs(a.manualMinutes)}</b>
        </div>
      </div>
    </div>
  </section>

  ${renderSymptoms(a)}
  ${methodology(a)}

  <div id="rx-step2">${STATE.recon ? renderReconcile(STATE.recon, CORE) : ''}</div>

  <section class="rx-cta" id="cta">
    <div class="rx-cta__copy">
      <h3>Готовы вылечить базу?</h3>
      <p>Диагностика показала объем проблемы. Лечение — нормализация в «Призме данных».</p>
    </div>
    <div class="rx-cta__actions">
      <a class="btn btn-p" href="${CONFIG.clinicUrl}">Продолжить лечение с Призмой данных →</a>
      <button type="button" class="btn btn-s" id="print">Скачать полный отчет</button>
    </div>
  </section>
  </div>`;

  const out = $('#out');
  out.innerHTML = html;
  out.classList.add('on');

  const inp = $('#scaleN'), o = $('#scaleOut');
  if (inp && o) inp.addEventListener('input', () => {
    const n = Math.max(1, +inp.value || a.rowsN);
    o.textContent = whrs(a.manualMinutes * n / a.rowsN);
    const w = document.getElementById('scaleWord');
    if (w) w.textContent = plural(n, 'запись', 'записи', 'записей');
  });

  out.querySelectorAll('[data-rx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.rx;
      const panel = document.getElementById('rx-panel-' + id);
      if (!panel) return;
      const open = !panel.hidden;
      out.querySelectorAll('.rx-panel').forEach(p => { p.hidden = true; });
      out.querySelectorAll('.rx-sym').forEach(b => b.classList.remove('is-open'));
      if (!open) {
        panel.hidden = false;
        btn.classList.add('is-open');
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });
  out.querySelectorAll('[data-rx-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.rxClose;
      const panel = document.getElementById('rx-panel-' + id);
      if (panel) panel.hidden = true;
      const card = out.querySelector(`[data-rx="${id}"]`);
      if (card) card.classList.remove('is-open');
    });
  });

  const printBtn = $('#print');
  if (printBtn) printBtn.addEventListener('click', () => window.print());
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
    STATE.demo = false;
    ingest(r.result);
  };
  r.onerror = () => showError('Не удалось прочитать файл.');
  r.readAsText(f, 'utf-8');
}

let pasteTimer;
$('#paste').addEventListener('input', e => {
  clearTimeout(pasteTimer);
  const v = e.target.value;
  pasteTimer = setTimeout(() => { if (v.trim().length > 10) { STATE.demo = false; ingest(v); } }, 400);
});

/* кнопки образцов */
(function () {
  const box = $('#demos');
  if (!box) return;
  box.innerHTML = DEMOS.map((d, i) => `<button class="demo-b" data-i="${i}">
      <b>Посмотреть пример диагноза</b>
    </button>`).join('');
  box.addEventListener('click', e => {
    const b = e.target.closest('.demo-b'); if (!b) return;
    const d = DEMOS[+b.dataset.i];
    $('#paste').value = d.csv;
    STATE.demo = true;
    ingest(d.csv);
    $('#go').click();
  });
})();

$('#reset').addEventListener('click', () => {
  STATE = { rows: null, cols: null, result: null, recon: null, demo: false };
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

