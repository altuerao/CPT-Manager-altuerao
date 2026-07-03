// ==UserScript==
// @name         CPT Manager v11 — by altuerao
// @namespace    altuerao.cpt.v11
// @version      12.55
// @description  CPT takibi — Rodeo öncelikli, optimize edilmiş canlı veri | crafted by altuerao
// @author       altuerao
// @copyright    2026, altuerao — Tüm hakları saklıdır
// @license      altuerao-internal
// @updateURL    https://raw.githubusercontent.com/altuerao/CPT-Manager-altuerao/main/CPT-Manager.user.js
// @downloadURL  https://raw.githubusercontent.com/altuerao/CPT-Manager-altuerao/main/CPT-Manager.user.js
// @match        https://picking-console.eu.picking.aft.a2z.com/*
// @match        https://picking-console.eu.aftx.amazonoperations.app/*
// @match        https://fans-dub.amazon.com/*
// @match        https://rodeo-dub.amazon.com/*
// @match        https://rodeo.amazon.com/*
// @match        https://flow-sortation-eu.amazon.com/*
// @match        https://fc-eligibility-website-dub.aka.amazon.com/*
// @match        https://*.github.io/*
// @match        file:///*
// @connect      rodeo-dub.amazon.com
// @connect      rodeo.amazon.com
// @connect      picking-console.eu.picking.aft.a2z.com
// @connect      picking-console.eu.aftx.amazonoperations.app
// @connect      qi-fcresearch-eu.corp.amazon.com
// @connect      fcresearch-eu.aka.amazon.com
// @connect      flow-sortation-eu.amazon.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_addValueChangeListener
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @run-at       document-end
// ==/UserScript==

/*
 *  ╔══════════════════════════════════════════════════════════════════╗
 *  ║                                                                  ║
 *  ║   ░█████╗░██████╗░████████╗  ███╗░░░███╗░██████╗░██████╗░       ║
 *  ║   ██╔══██╗██╔══██╗╚══██╔══╝  ████╗░████║██╔════╝░██╔══██╗       ║
 *  ║   ██║░░╚═╝██████╔╝░░░██║░░░  ██╔████╔██║██║░░██╗░██████╔╝       ║
 *  ║   ██║░░██╗██╔═══╝░░░░██║░░░  ██║╚██╔╝██║██║░░╚██╗██╔══██╗       ║
 *  ║   ╚█████╔╝██║░░░░░░░░██║░░░  ██║░╚═╝░██║╚██████╔╝██║░░██║       ║
 *  ║   ░╚════╝░╚═╝░░░░░░░░╚═╝░░░  ╚═╝░░░░░╚═╝░╚═════╝░╚═╝░░╚═╝       ║
 *  ║                                                                  ║
 *  ║   CPT Manager v10.31 — Crafted by altuerao                       ║
 *  ║   © 2026 altuerao · IST2 FC operations                           ║
 *  ║                                                                  ║
 *  ║   Bu script tek bir kişi tarafından geliştirilmiştir: altuerao   ║
 *  ║   Kopyalandığında kaynak atfı bırakılması rica edilir.           ║
 *  ║                                                                  ║
 *  ╚══════════════════════════════════════════════════════════════════╝
 */

(function () {
'use strict';

// crafted by altuerao — IST2
const _AUTHOR_ID = atob('YWx0dWVyYW8=');  // "altuerao" — base64 (göze çarpmasın)
const _CPT_BUILD = { author: _AUTHOR_ID, version: '10.26', year: 2026, site: 'IST2' };
window.__cptCraftedBy = _AUTHOR_ID;  // Runtime check için

// ── Sayfa tespiti ──────────────────────────────────────────
const H = location.hostname;
const P = location.pathname;
const HASH = location.hash || '';
const IS_FILE      = location.protocol === 'file:';
const IS_FANS      = H.includes('fans-dub');
const IS_PICKING   = H.includes('picking-console');
const IS_RODEO     = H.includes('rodeo-dub');
const IS_SORTATION = H.includes('flow-sortation');                          // v10.22
const IS_ELIG      = H.includes('fc-eligibility');                          // v10.86 — Pickers Dashboard (yetki sayısı)
// v12.44: iframe içindeyken (oto-kurulum gezinmesi) hangi PC sayfasındayız — location'dan bağımsız ayar için
const _PC_PATH_WF = IS_PICKING && P.includes('pick-workforce');
const _PC_PATH_SC = IS_PICKING && P.includes('current-scorecard');
const _PC_PATH_PA = IS_PICKING && P.includes('pick-areas');
// v12.47 HOTFIX: Bayraklar ESKİ HALİNE döndü (yalın path tespiti). Önceki "&& !IS_IFRAME"
//   ÖLÜMCÜLDÜ: IS_IFRAME satır 100'de tanımlı ama burası satır 81 → const TDZ ReferenceError
//   → tüm script Picking Console'da çöküyordu (veri çekmiyor, ayar yapmıyordu). iframe koruması
//   artık veri bloklarının KENDİ başında (aşağıda IS_IFRAME tanımından SONRA) yapılıyor.
const IS_WORKFORCE = _PC_PATH_WF;
const IS_SCANNER   = IS_PICKING && P.includes('all-in-scanner');
const IS_SCORECARD = _PC_PATH_SC;
const IS_INDV_SC   = IS_PICKING && P.includes('individual-scorecard/picker/');
const IS_PICK_AREAS= _PC_PATH_PA;
const IS_EXSD      = IS_RODEO   && P.includes('ExSD');
// v10.48: Bu sayfa Fracs Rodeo mu? (?fracs=FRACS query parametresi)
// Tek cache (cpt_transit_batches_v9) kullanıyoruz, sadece tote'lara isFracs=true flag koyuyoruz.
// Bu sayede normal ve Fracs sayfası farklı sekmelerde açıkken her ikisi de aynı cache'e merge eder.
const IS_EXSD_FRACS = IS_EXSD && /[?&]fracs=FRACS\b/i.test(location.search);
const IS_BUFFER    = IS_SORTATION && (HASH.includes('/buffer/current-status') || P.includes('/buffer/current-status'));
// v12.27 [SİTE MODU]: CPT Manager artık internette bir siteden de (GitHub Pages vb.) açılabilir.
//   Site sayfası <meta name="cpt-manager" content="1"> işareti taşır. Userscript o sayfada
//   çalışınca (@match https://*.github.io/*) KÖPRÜ moduna girer: GM storage'daki veriyi
//   (Amazon sekmelerindeki instance'ların yazdığı) CustomEvent ile sayfaya aktarır.
//   Amazon sekmesi kazır → GM_setValue → site sekmesindeki instance GM'den okur → CustomEvent → site render.
const IS_CPT_SITE  = !IS_FILE && !!document.querySelector('meta[name="cpt-manager"]');

// iframe içinde mi? (Buffer DOM scrape iframe'de gereksiz çalışmasın)
const IS_IFRAME = (function(){ try { return window.self !== window.top; } catch(e) { return true; } })();

// ── Global debug log altyapısı ─────────────────────────────
// dlog'u IIFE'nin başında tanımlıyoruz ki her blok (file://, picking,
// rodeo, fans) aynı GM storage anahtarına yazsın. Eski IS_WORKFORCE
// içindeki dlog tanımı bu noktada artık gereksiz (silinmiş olmalı).
const _HOST_TAG = (function(){
    if(location.protocol === 'file:') return 'FILE';
    const h = location.hostname || '';
    if(h.includes('rodeo-dub'))        return 'RODEO';
    if(h.includes('picking-console'))  return 'PICKING';
    if(h.includes('fans-dub'))         return 'FANS';
    if(h.includes('qi-fcresearch'))    return 'FCR';
    return h.split('.')[0].toUpperCase().slice(0,8) || 'PAGE';
})();

// v12.18: dlog KOTA FİX. Eskiden her dlog çağrısı (184 yer, tarama başına onlarca kez)
//   300 elemanlı log array'ini HEM GM storage HEM localStorage'a yazıyordu. Büyük transit
//   batch (2000 tote) + sürekli log yazımı localStorage kotasını doldurup QuotaExceededError
//   fırlatıyordu → o an çalışan kod çöküyor, "script bazen çalışmıyor" oluyordu.
//   ÇÖZÜM: (1) Log yazımını throttle et (max 1sn'de bir diske yaz, arada bellekte biriktir),
//   (2) localStorage'a log YAZMA (GM storage yeterli — pano cptGetDebugLogs ile GM'den okur),
//   (3) Kota hatası olursa logları otomatik temizle (kendini toparla).
let _dlogBuffer = [];
let _dlogLastFlush = 0;
let _dlogFlushTimer = null;
function _dlogFlush() {
    _dlogFlushTimer = null;
    _dlogLastFlush = Date.now();
    try {
        let logs = [];
        try { logs = GM_getValue('cpt_debug_logs', []) || []; } catch(e) {}
        if(!Array.isArray(logs)) logs = [];
        logs.push(..._dlogBuffer);
        _dlogBuffer = [];
        while(logs.length > 300) logs.shift();
        try {
            GM_setValue('cpt_debug_logs', logs);
        } catch(e) {
            // Kota/hata → logları yarıya indir, tekrar dene (kendini toparla)
            try { GM_setValue('cpt_debug_logs', logs.slice(-100)); } catch(e2) {}
        }
        // v12.18: localStorage'a da yaz (pano file:// fallback için) ama SADECE throttle'lı
        //   flush'ta (1sn'de bir), her dlog'da değil → kota spam'i olmaz.
        try {
            localStorage.setItem('cpt_debug_logs', JSON.stringify(logs));
        } catch(e) {
            try { localStorage.setItem('cpt_debug_logs', JSON.stringify(logs.slice(-100))); } catch(e2) {}
        }
    } catch(e) {}
}
function dlog(...args) {
    try { console.log('[CPT10 ' + _HOST_TAG + ']', ...args); } catch(e) {}
    try {
        const txt = args.map(a => {
            if(typeof a === 'string') return a;
            try { return JSON.stringify(a); } catch(e) { return String(a); }
        }).join(' ');
        const ts = new Date().toLocaleTimeString('tr-TR');
        _dlogBuffer.push(ts + ' [' + _HOST_TAG + '] ' + txt);
        if(_dlogBuffer.length > 100) _dlogBuffer.shift();   // bellek koruması
        // Throttle: son yazımdan 1sn geçtiyse hemen yaz, değilse zamanlayıcı kur
        const now = Date.now();
        if(now - _dlogLastFlush >= 1000) {
            _dlogFlush();
        } else if(!_dlogFlushTimer) {
            _dlogFlushTimer = setTimeout(_dlogFlush, 1000);
        }
    } catch(e) {}
}

// HTML / diğer sayfalardan erişim için window'a aç
try {
    window.cptGetDebugLogs = function() {
        try { return GM_getValue('cpt_debug_logs', []) || []; } catch(e) { return []; }
    };
    window.cptClearDebugLogs = function() {
        try { GM_setValue('cpt_debug_logs', []); } catch(e) {}
        try { localStorage.setItem('cpt_debug_logs', '[]'); } catch(e) {}
    };
    window.cptForceFetch = function(what) {
        try { GM_setValue('cpt_force_fetch_gm', { what, ts: Date.now() }); } catch(e) {}
        try { localStorage.setItem('cpt_force_fetch', JSON.stringify({ what, ts: Date.now() })); } catch(e) {}
    };
} catch(e) {}


// Tampermonkey menü komutları — F12 GEREKMEDEN log al/kopyala/temizle
// Tampermonkey ikonuna tıklayınca CPT Manager v10 altında görünür
// iframe içinde menü kaydetme (sadece ana sayfa)
try {
    if(typeof GM_registerMenuCommand === 'function' && !IS_IFRAME) {
        GM_registerMenuCommand('📋 Logları yeni sekmede aç', function() {
            let logs = [];
            try { logs = GM_getValue('cpt_debug_logs', []) || []; } catch(e) {}
            const body = (logs.length ? logs.join('\n') : '(log yok)');
            // data: URL ile yeni sekme — clipboard izni gerekmez, kopyalanabilir text
            const html = '<!doctype html><meta charset="utf-8"><title>CPT Logs ' +
                new Date().toLocaleString('tr-TR') + '</title>' +
                '<style>body{font:12px/1.4 ui-monospace,Menlo,Consolas,monospace;' +
                'background:#0b0d12;color:#d6deeb;padding:14px;margin:0;white-space:pre-wrap;' +
                'word-break:break-word}.hdr{color:#7fdbca;border-bottom:1px solid #233;' +
                'padding-bottom:6px;margin-bottom:8px}</style>' +
                '<div class="hdr">CPT Manager v10 — ' + logs.length + ' log entries — ' +
                new Date().toLocaleString('tr-TR') + '</div>' +
                body.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]);
            const blob = new Blob([html], {type:'text/html'});
            window.open(URL.createObjectURL(blob), '_blank');
        });

        GM_registerMenuCommand('📋 Logları panoya kopyala', function() {
            let logs = [];
            try { logs = GM_getValue('cpt_debug_logs', []) || []; } catch(e) {}
            const text = logs.length ? logs.join('\n') : '(log yok)';
            try {
                if(typeof GM_setClipboard === 'function') {
                    GM_setClipboard(text, 'text');
                    alert('✓ ' + logs.length + ' log entry panoya kopyalandı.');
                } else if(navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(text).then(
                        () => alert('✓ ' + logs.length + ' log panoya kopyalandı.'),
                        e  => alert('Kopyalanamadı: ' + e)
                    );
                } else {
                    alert('Clipboard API yok. "Yeni sekmede aç" komutunu kullanın.');
                }
            } catch(e) { alert('Hata: ' + e); }
        });

        GM_registerMenuCommand('🗑️ Logları temizle', function() {
            try { GM_setValue('cpt_debug_logs', []); } catch(e) {}
            try { localStorage.setItem('cpt_debug_logs', '[]'); } catch(e) {}
            alert('✓ Loglar temizlendi.');
        });

        // v10.19: Tüm CPT cache'i tek tıkla temizle
        GM_registerMenuCommand('💣 Tüm CPT cache\'i temizle', function() {
            if (!confirm('Tüm CPT cache verileri silinecek:\n\n' +
                '· Workforce (pickerlar, batchler)\n' +
                '· Scorecard (hızlar, rateler)\n' +
                '· Transit (totes, lokasyonlar)\n' +
                '· Pick Areas, Batches, Scanner\n' +
                '· Vardiya filtreleri, individual rates\n\n' +
                'HTML "veri bekleniyor" gösterecek, userscript birkaç saniyede ' +
                'yeniden çekecek (eğer ilgili Amazon sayfaları açıksa).\n\n' +
                'Devam edilsin mi?')) return;
            const keys = [
                'cpt_workforce_v9','cpt_scanner_v9','cpt_scorecard_v9','cpt_picker_counts_v9',
                'cpt_pick_areas_v9','cpt_transit_batches_v9','cpt_scanner_cpt_v9',
                'cpt_not_yet_picked_v9','cpt_shift_scorecard','cpt_individual_rates_v9',
                'cpt_scorecard_path_v9','cpt_scorecard_path_shift_v9','cpt_transit_emp_cache_v2',
                'cpt_shift_request','cpt_shift_scorecard_gm','cpt_shift_saved',
                'cpt_scorecard_api_url','cpt_force_fetch','cpt_force_fetch_last_seen',
                'cpt_wf_scanner_v9','cpt_path_scorecard_request','cpt_scorecard_url_request'
            ];
            let nLocal = 0, nGm = 0;
            keys.forEach(k => {
                try { if(localStorage.getItem(k) !== null) { localStorage.removeItem(k); nLocal++; } } catch(e) {}
                try {
                    if(typeof GM_deleteValue === 'function') {
                        GM_deleteValue(k);
                        nGm++;
                    }
                } catch(e) {}
            });
            // HTML tarafına sinyal — sayfa açıksa hemen render'ı tazelesin
            try { localStorage.setItem('cpt_cache_cleared_signal', String(Date.now())); } catch(e) {}
            try {
                const bc = new BroadcastChannel('cpt_data');
                bc.postMessage({ key:'cpt_cache_cleared_signal', value:String(Date.now()) });
                bc.close();
            } catch(e) {}
            dlog('💣 Tüm CPT cache temizlendi: ' + nLocal + ' localStorage + ' + nGm + ' GM key');
            alert('✓ Cache temizlendi.\n\n' + nLocal + ' localStorage anahtarı + ' + nGm + ' GM anahtarı silindi.\n\nHTML dashboard\'unuz açıksa F5 ile yenileyin, ya da otomatik tazelenmesini bekleyin.');
        });

        GM_registerMenuCommand('🔬 Test fetchTransit', function() {
            try {
                GM_setValue('cpt_force_fetch_gm', { what:'transit', ts: Date.now() });
                alert('✓ Sinyal gönderildi.\n\nTransit fetch artık Rodeo ExSD sayfasından çalışıyor.\nRodeo ExSD sekmesi açıksa 1-2 saniyede tetiklenecek.\n\nDoğrudan tetiklemek için Rodeo ExSD\'deyken menüden\n"🚚 Transit fetch (Rodeo ExSD)" komutunu kullanın.');
            } catch(e) { alert('Hata: ' + e); }
        });

        // Scorecard diagnostic — sayfanın scrollable yapısını analiz et, popup'ta göster
        // Bu menü tüm sayfalardan görünür ama sadece scorecard'da anlamlı sonuç verir
        GM_registerMenuCommand('🔍 Scorecard diagnostic', function() {
            try {
                // Sadece scorecard sayfasında çalış
                if (!location.pathname.includes('current-scorecard')) {
                    alert('⚠️ Bu komut sadece scorecard sayfasında çalışır.\n\nLütfen önce scorecard sayfasına git:\n' +
                          'picking-console.eu.../reports/current-scorecard\n\nFiltreleri ayarla, Search bas, sonra bu komutu tıkla.');
                    return;
                }

                const lines = [];
                lines.push('═══ SCORECARD DIAGNOSTIC ═══');
                lines.push('Zaman: ' + new Date().toLocaleString('tr-TR'));
                lines.push('');

                // 1) Found sayısı
                const titleMatch = document.body.textContent.match(/Found (\d+) Scorecard results/i);
                lines.push('📊 Sayfa başlığı: ' + (titleMatch ? titleMatch[0] : 'BULUNAMADI'));

                // 2) DOM satır sayısı
                const rows = document.querySelectorAll('tr.awsui-table-row');
                lines.push('📋 DOM\'daki satır sayısı: ' + rows.length);

                // 3) Harvest size
                lines.push('🌾 window._scoreHarvest.size: ' + (window._scoreHarvest?.size ?? 'YOK'));

                // 4) Aktif filtreler
                const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
                const times = [...inputs].map(i => i.value).filter(v => /^\d{2}:\d{2}$/.test(v));
                lines.push('⏰ Saat filtreleri: ' + (times.length ? times.slice(0,2).join(' - ') : 'yok'));

                lines.push('');
                lines.push('═══ SCROLLABLE ELEMENTS ═══');
                const all = document.querySelectorAll('*');
                let found = 0;
                for (const el of all) {
                    if (el.scrollHeight > el.clientHeight + 50) {
                        const cs = getComputedStyle(el);
                        if (cs.overflowY === 'auto' || cs.overflowY === 'scroll' ||
                            cs.overflow === 'auto' || cs.overflow === 'scroll') {
                            found++;
                            lines.push(`#${found}: ${el.tagName} class:"${(el.className+'').slice(0,50)}"`);
                            lines.push(`   id:"${el.id||'(no id)'}" sH:${el.scrollHeight} cH:${el.clientHeight} delta:${el.scrollHeight-el.clientHeight}`);
                            lines.push(`   tablo içeriyor: ${!!el.querySelector('table')} | tbody: ${!!el.querySelector('tbody')}`);
                        }
                    }
                }
                lines.push('');
                lines.push('✅ Toplam ' + found + ' scrollable container bulundu');

                // 5) Tbody parent zinciri
                const tbody = document.querySelector('tbody');
                if (tbody) {
                    lines.push('');
                    lines.push('═══ TBODY PARENT CHAIN ═══');
                    lines.push('Tbody children count: ' + tbody.children.length);
                    let p = tbody.parentElement;
                    let depth = 0;
                    while (p && p !== document.body && depth < 12) {
                        const cs = getComputedStyle(p);
                        const oneline = `[${depth}] ${p.tagName}.${(p.className+'').slice(0,40)}`;
                        lines.push(oneline);
                        lines.push(`   overflowY:${cs.overflowY} sH:${p.scrollHeight} cH:${p.clientHeight}`);
                        p = p.parentElement;
                        depth++;
                    }
                }

                // 6) Harvest map'ten ilk 5 picker
                if (window._scoreHarvest && window._scoreHarvest.size) {
                    lines.push('');
                    lines.push('═══ İLK 5 PICKER (harvest map) ═══');
                    let i = 0;
                    for (const [login, rec] of window._scoreHarvest) {
                        if (++i > 5) break;
                        lines.push(`${i}. ${login} — picks:${rec.picks} dpr:${rec.dpr} pctDT:${rec.pctDT}`);
                    }
                }

                // Popup yerine yeni sekmede aç (kopyalanabilir)
                const html = '<!doctype html><meta charset="utf-8"><title>Scorecard Diagnostic</title>' +
                    '<style>body{font:13px/1.6 ui-monospace,Menlo,Consolas,monospace;' +
                    'background:#0b0d12;color:#d6deeb;padding:20px;margin:0;white-space:pre-wrap;' +
                    'word-break:break-word}h2{color:#7fdbca;border-bottom:1px solid #233;' +
                    'padding-bottom:10px;margin-top:0}button{background:#16a34a;color:#fff;' +
                    'border:none;padding:8px 16px;font-size:13px;cursor:pointer;border-radius:6px;' +
                    'margin-bottom:10px}button:hover{background:#22c55e}</style>' +
                    '<h2>Scorecard Diagnostic — ' + new Date().toLocaleString('tr-TR') + '</h2>' +
                    '<button onclick="navigator.clipboard.writeText(document.querySelector(\'#raw\').innerText).then(()=>this.textContent=\'✓ Kopyalandı\')">📋 Panoya kopyala</button>' +
                    '<div id="raw">' + lines.join('\n').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c]) + '</div>';
                const blob = new Blob([html], {type:'text/html'});
                window.open(URL.createObjectURL(blob), '_blank');
            } catch(e) {
                alert('Hata: ' + (e.message || e));
            }
        });

        // ═══ v12.45: PC AYAR TEŞHİS — canlı sayfada dişli/panel/toggle yapısını göster ═══
        GM_registerMenuCommand('🔧 PC ayar teşhis', function() {
            try {
                var L = [];
                L.push('═══ PC AYAR TEŞHİS ═══');
                L.push('URL: ' + location.pathname);
                L.push('Sayfa: ' + (_PC_PATH_WF?'workforce':(_PC_PATH_PA?'pick-areas':(_PC_PATH_SC?'scorecard':'?'))));
                L.push('');
                // dişli aday butonları
                var btns = [...document.querySelectorAll('button')].filter(function(b){ return b.offsetParent!==null; });
                L.push('Görünür buton sayısı: ' + btns.length);
                var gearCands = btns.filter(function(b){
                    var al=(b.getAttribute('aria-label')||'')+' '+(b.getAttribute('title')||'')+' '+(b.className||'');
                    return /pref|setting|gear|cog|ayar/i.test(al) || b.querySelector('svg');
                });
                L.push('Dişli/ikon aday buton: ' + gearCands.length);
                gearCands.slice(0,8).forEach(function(b,i){
                    L.push('  ['+i+'] aria="'+(b.getAttribute('aria-label')||'')+'" title="'+(b.getAttribute('title')||'')+'" class="'+String(b.className).slice(0,40)+'" svg='+(!!b.querySelector('svg')));
                });
                L.push('');
                // toggle/switch yapısı
                var sw = document.querySelectorAll('[role="switch"], input[type="checkbox"]');
                L.push('Switch/checkbox sayısı: ' + sw.length);
                [...sw].slice(0,6).forEach(function(s,i){
                    var row=s.closest('label,li,tr,[class*="row"],[class*="option"],div');
                    L.push('  ['+i+'] tag='+s.tagName+' type='+(s.type||'')+' role='+(s.getAttribute('role')||'')+' checked='+(s.checked||s.getAttribute('aria-checked'))+' metin="'+(row?row.textContent.replace(/\s+/g,' ').trim().slice(0,30):'')+'"');
                });
                L.push('');
                L.push('Kurulum bayrakları:');
                L.push('  wf: ' + localStorage.getItem('cpt_pc_setup_wf_v4'));
                L.push('  pa: ' + localStorage.getItem('cpt_pc_setup_pa_v4'));
                L.push('  sc: ' + localStorage.getItem('cpt_pc_setup_sc_v4'));
                var out = L.join('\n');
                console.log(out);
                var w = window.open('', '_blank');
                w.document.write('<pre style="font:13px monospace;padding:20px;white-space:pre-wrap">'+out.replace(/</g,'&lt;')+'</pre>');
            } catch(e){ alert('Teşhis hatası: '+e); }
        });

        // ═══ v12.45: PC ayarlarını ŞİMDİ yap — bayrakları sıfırla + otomasyonu anında tetikle ═══
        GM_registerMenuCommand('🔧 PC ayarlarını şimdi yap (bu sayfa)', function() {
            try {
                var pg = _PC_PATH_WF?'wf':(_PC_PATH_PA?'pa':(_PC_PATH_SC?'sc':null));
                if (!pg) { alert('Bu bir Picking Console ayar sayfası değil.\nworkforce / pick-areas / scorecard sayfasında çalıştır.'); return; }
                localStorage.removeItem('cpt_pc_setup_'+pg+'_v4');
                if (typeof _pcApplySettings === 'function') {
                    _pcApplySettings(document, pg, function(ok){
                        if (ok) { try { localStorage.setItem('cpt_pc_setup_'+pg+'_v4','done'); } catch(e){} }
                        alert(ok ? ('✓ '+pg+' ayarları uygulandı.') : ('⚠️ '+pg+' ayarları uygulanamadı — "🔧 PC ayar teşhis" ile dişli/panel yapısına bak, bana ilet.'));
                    });
                } else alert('_pcApplySettings yok.');
            } catch(e){ alert('Hata: '+e); }
        });
    }
} catch(e) {}

// Boot log — script bu sayfaya yüklendi
dlog('🟢 SCRIPT LOADED [v12.55] · crafted by ' + _AUTHOR_ID + ' · ' + location.href.substring(0, 120));
// Çalışırlık kontrolü — _AUTHOR_ID değiştirilmişse uyarı (silinmesi zorlaştırır)
if (_AUTHOR_ID !== 'altuerao') {
    console.warn('[CPT] Author signature mismatch — script integrity warning');
}


// ── Yardımcılar ────────────────────────────────────────────
const FC_ID = P.split('/')[2] || 'IST2';
const PC    = `https://picking-console.eu.picking.aft.a2z.com/fc/${FC_ID}`;
// v11.29: API endpoint'leri için ham domain — /fc/{FC} prefix'i YOK.
// Örnek: ${PC_API}/api/fcs/IST2/area-details-snapshot
//   doğru: https://picking-console.eu.picking.aft.a2z.com/api/fcs/IST2/area-details-snapshot
//   yanlış: ${PC}/api/... → ekstra /fc/IST2/ ekler, 2 KB SPA shell döner
const PC_API = `https://picking-console.eu.picking.aft.a2z.com`;
const RODEO = `https://rodeo-dub.amazon.com/${FC_ID}`;

// BroadcastChannel — tek instance, lazy init
let _bc = null;
function bc() {
    if(!_bc) try { _bc = new BroadcastChannel('cpt_data'); } catch(e) {}
    return _bc;
}

// localStorage + GM + BC'ye yaz
function push(key, obj) {
    if(!obj || !obj.ts) obj = { data: obj, ts: Date.now() };
    const s = JSON.stringify(obj);
    try {
        localStorage.setItem(key, s);
    } catch(e) {
        // v12.18: Kota doldu (QuotaExceededError) → yer aç, tekrar dene.
        //   Debug logları ve eski geçici anahtarları temizle → asıl veri (transit batch) yazılabilsin.
        try {
            localStorage.removeItem('cpt_debug_logs');
            localStorage.removeItem('cpt_force_fetch');
            localStorage.setItem(key, s);   // tekrar dene
        } catch(e2) {
            // Hâlâ olmuyorsa GM storage'a güven (aşağıda yazılıyor), localStorage'ı atla
        }
    }
    try { GM_setValue(key, obj); } catch(e) {}
    try { bc()?.postMessage({ key, value: s }); } catch(e) {}
}

// localStorage'dan güvenli oku
function read(key) {
    try {
        const raw = GM_getValue(key, null) || localStorage.getItem(key);
        if(!raw) return null;
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch(e) { return null; }
}

// ═══ v12.43 CANLI SAYFA NABZI (HEARTBEAT) ═══
// Sorun: gate verinin YAŞINA bakıyordu (freshMs). Bir sayfa kapatılsa bile veri hâlâ
//   pencere içindeyse "açık" sanılıp giriş geçiyordu. Çözüm: her AKTİF kaynak sekmesi
//   GM'e 8sn'de bir "ben açığım" damgası yazar (cpt_hb_{source} = {ts}). Site tarafı bu
//   damganın ÇOK TAZE (≤30sn) olup olmadığına bakar → sayfa kapanınca 30sn içinde düşer,
//   gate o kaynağı "kapalı" gösterir ve giriş (Atla hariç) sağlanmaz.
(function _cptHeartbeat(){
    if (IS_CPT_SITE || IS_FILE || IS_IFRAME) return;   // sadece gerçek Amazon kaynak sekmeleri
    var hbKey = null;
    if (IS_EXSD)      hbKey = 'cpt_hb_transit';
    else if (IS_WORKFORCE) hbKey = 'cpt_hb_workforce';
    else if (IS_ELIG)      hbKey = 'cpt_hb_elig';
    else if (IS_BUFFER)    hbKey = 'cpt_hb_sortation';
    if (!hbKey) return;
    function beat(){
        try { GM_setValue(hbKey, { ts: Date.now() }); } catch(e) {}
        try { localStorage.setItem(hbKey, JSON.stringify({ ts: Date.now() })); } catch(e) {}
    }
    beat();
    setInterval(beat, 8000);   // 8sn'de bir taze damga
})();


// ═══════════════════════════════════════════════════════════════════════════
// v12.27 [SİTE KÖPRÜSÜ] — ATLAS modeli. Site (https://KULLANICI.github.io/cpt-manager)
//   açıkken bu userscript instance'ı KÖPRÜ olur: Amazon sekmelerindeki instance'ların
//   GM_setValue ile yazdığı veriyi okur, CustomEvent ile site sayfasına aktarır.
//   Protokol:
//     site → 'cpt:ping'         → köprü → 'cpt:pong' {version}      (el sıkışma)
//     site → 'cpt:requestData'  → köprü → 'cpt:data' {json string}  (ilk yükleme)
//     Amazon GM_setValue        → köprü (GM_addValueChangeListener) → 'cpt:data'  (canlı akış)
//   Not: CustomEvent detail STRING (JSON) — Tampermonkey sandbox'ları arasında string
//   her modda güvenle geçer (obje cloneInto gerektirebilir, string gerektirmez).
// ═══════════════════════════════════════════════════════════════════════════
if (IS_CPT_SITE) {
    const BRIDGE_VERSION = '12.55';
    // Siteye aktarılacak GM anahtarları — cpt_ ile başlayan her şey.
    // v12.32: cpt_perm_* HARİÇ — eğitim verisi kişisel, köprüden gitmez; site tarafında
    //   kullanıcı kendi "Yedek Yükle"siyle getirir.
    function _bridgeKeys() {
        try {
            if (typeof GM_listValues === 'function') {
                return (GM_listValues() || []).filter(k => String(k).startsWith('cpt_') && !String(k).startsWith('cpt_perm_'));
            }
        } catch(e) {}
        // Fallback sabit liste (GM_listValues yoksa)
        return ['cpt_transit_batches_v9','cpt_workforce_v9','cpt_pick_areas_v9',
                'cpt_debug_logs','cpt_tote_msgs_sent','cpt_auto_refresh_flag'];
    }
    let _bridgeLastSent = '';
    const _bridgeListenerKeys = new Set();   // v12.46: hangi anahtarlara listener kuruldu (yenileri eklemek için)
    function _bridgeSendAll(reason) {
        try {
            const payload = {};
            for (const k of _bridgeKeys()) {
                try {
                    const v = GM_getValue(k, null);
                    if (v != null) payload[k] = v;
                } catch(e) {}
            }
            const s = JSON.stringify(payload);
            if (s === _bridgeLastSent) return;   // değişiklik yok → gönderme (gereksiz render önle)
            _bridgeLastSent = s;
            document.dispatchEvent(new CustomEvent('cpt:data', { detail: s }));
            try { console.log('[CPT BRIDGE] veri siteye aktarıldı (' + (reason||'') + ') · ' + Object.keys(payload).length + ' anahtar · ' + (s.length/1024).toFixed(0) + 'KB'); } catch(e) {}
        } catch(e) {}
    }
    // El sıkışma: site ping atar, köprü pong döner
    document.addEventListener('cpt:ping', () => {
        try { document.dispatchEvent(new CustomEvent('cpt:pong', { detail: BRIDGE_VERSION })); } catch(e) {}
    });
    // Site ilk veri ister
    document.addEventListener('cpt:requestData', () => _bridgeSendAll('requestData'));
    // Canlı akış: Amazon sekmesi GM'e yazınca köprü tetiklenir
    let _bridgeDebounce = null;
    function _bridgeScheduleSend() {
        if (_bridgeDebounce) return;
        _bridgeDebounce = setTimeout(() => { _bridgeDebounce = null; _bridgeSendAll('gm-change'); }, 500);
    }
    try {
        if (typeof GM_addValueChangeListener === 'function') {
            for (const k of _bridgeKeys()) {
                try { GM_addValueChangeListener(k, _bridgeScheduleSend); _bridgeListenerKeys.add(k); } catch(e) {}
            }
            // v12.46: Heartbeat anahtarları (cpt_hb_*) köprü kurulurken henüz GM'de OLMAYABİLİR
            //   (Amazon sekmesi ilk beat'i atmamış). O yüzden listener'a takılmazlar. Çözüm:
            //   (a) 5sn'de bir _bridgeSendAll — yeni heartbeat'leri hızla yakalar (dedup zaten var),
            //   (b) 20sn'de bir listener listesini tazele (yeni cpt_hb_* anahtarlarına da bağlan).
            setInterval(() => { _bridgeSendAll('interval'); }, 5000);
            setInterval(() => {
                try {
                    for (const k of _bridgeKeys()) {
                        if (!_bridgeListenerKeys.has(k)) {
                            try { GM_addValueChangeListener(k, _bridgeScheduleSend); _bridgeListenerKeys.add(k); } catch(e) {}
                        }
                    }
                } catch(e) {}
            }, 20000);
        } else {
            // Listener yok → polling fallback (2sn'de bir değişiklik kontrolü — _bridgeLastSent dedup'lar)
            setInterval(() => { _bridgeSendAll('poll'); }, 2000);
        }
    } catch(e) {}
    // Açılışta pong hazır bekle + siteye erken veri ver
    setTimeout(() => _bridgeSendAll('init'), 800);
    try { console.log('[CPT BRIDGE] köprü aktif — site modu, v' + BRIDGE_VERSION); } catch(e) {}

    // ═══ v12.48 TERS KÖPRÜ: site localStorage → GM ═══
    // KÖK SEBEP: HTML→userscript sinyalleri (vardiya, yenile, force-fetch, atama, akış)
    //   yalnızca IS_FILE bloğundaki forwarder'larla GM'e taşınıyordu. Site modunda bu
    //   forwarder'lar YOKTU → sitede vardiya butonuna basınca cpt_shift_request sitenin
    //   kendi localStorage'ında ölü kalıyor, Amazon sekmeleri isteği hiç görmüyordu
    //   ("Scorecard yenileniyor..." → 60sn sonra "Veri gelmedi").
    // Aşağısı IS_FILE'daki forwarder'ların birebir karşılığıdır (+ 7. madde:
    //   cpt_scorecard_url_request — sendScorecardUrlSignal'ın GM ayağı).

    // 1) Yenile sinyali + oto-yenileme bayrağı (1sn)
    let _revSig = '';
    setInterval(() => {
        try {
            const s = localStorage.getItem('cpt_refresh_workforce')||'';
            if(s && s!==_revSig) { _revSig=s; GM_setValue('cpt_refresh_signal',s); }
            const f = localStorage.getItem('cpt_auto_refresh_flag');
            if(f!==null) GM_setValue('cpt_auto_refresh_flag',f);
        } catch(e) {}
    }, 1000);

    // 2) Vardiya isteği → GM + cevabı GM → site localStorage (250ms)
    let _revShiftTs = 0, _revShiftRespTs = 0;
    setInterval(() => {
        try {
            const req = localStorage.getItem('cpt_shift_request');
            if(req) {
                const obj = JSON.parse(req);
                if(obj.ts && obj.ts !== _revShiftTs) {
                    _revShiftTs = obj.ts;
                    GM_setValue('cpt_shift_request_gm', obj);
                }
            }
            const resp = GM_getValue('cpt_shift_scorecard_gm', null);
            if(resp) {
                const respObj = typeof resp==='string' ? JSON.parse(resp) : resp;
                if(respObj.ts && respObj.ts !== _revShiftRespTs) {
                    _revShiftRespTs = respObj.ts;
                    localStorage.setItem('cpt_shift_scorecard', JSON.stringify(respObj));
                    window.dispatchEvent(new Event('cpt_data_updated'));
                }
            }
        } catch(e) {}
    }, 250);

    // 3) Vardiya seçimi (cpt_shift_saved) → GM (500ms)
    let _revSavedShift = '';
    setInterval(() => {
        try {
            const saved = localStorage.getItem('cpt_shift_saved') || '';
            if(saved !== _revSavedShift) {
                _revSavedShift = saved;
                if(saved) GM_setValue('cpt_shift_saved_gm', saved);
                else if(typeof GM_deleteValue==='function') GM_deleteValue('cpt_shift_saved_gm');
            }
        } catch(e) {}
    }, 500);

    // 4) Force-fetch sinyali → GM (250ms)
    let _revForceTs = 0;
    setInterval(() => {
        try {
            const raw = localStorage.getItem('cpt_force_fetch');
            if (!raw) return;
            const obj = JSON.parse(raw);
            if (obj?.ts && obj.ts !== _revForceTs) {
                _revForceTs = obj.ts;
                GM_setValue('cpt_force_fetch_gm', obj);
            }
        } catch(e) {}
    }, 250);

    // 5) Picker atama kuyruğu ↔ GM (çift yönlü, 300ms)
    let _revAsgLocal = '', _revAsgGM = '';
    setInterval(() => {
        try {
            const local = localStorage.getItem('cpt_assign_moves_v1') || '';
            const gmRaw = GM_getValue('cpt_assign_moves_v1', null);
            const gm = gmRaw == null ? '' : (typeof gmRaw === 'string' ? gmRaw : JSON.stringify(gmRaw));
            if (local !== _revAsgLocal) {
                _revAsgLocal = local;
                if (local) GM_setValue('cpt_assign_moves_v1', local);
                else if (typeof GM_deleteValue === 'function') { try { GM_deleteValue('cpt_assign_moves_v1'); } catch(e){} GM_setValue('cpt_assign_moves_v1', ''); }
                else GM_setValue('cpt_assign_moves_v1', '');
                _revAsgGM = local;
            } else if (gm !== _revAsgGM) {
                _revAsgGM = gm;
                if (gm && gm !== local) {
                    localStorage.setItem('cpt_assign_moves_v1', gm);
                    _revAsgLocal = gm;
                    window.dispatchEvent(new Event('cpt_data_updated'));
                } else if (!gm && local) {
                    localStorage.removeItem('cpt_assign_moves_v1');
                    _revAsgLocal = '';
                    window.dispatchEvent(new Event('cpt_data_updated'));
                }
            }
        } catch(e) {}
    }, 300);

    // 6) "Atamayı Başlat" akış sinyali → GM (250ms)
    let _revFlowTs = 0;
    setInterval(() => {
        try {
            const raw = localStorage.getItem('cpt_elig_flow_start');
            if (!raw) return;
            const obj = JSON.parse(raw);
            if (obj?.ts && obj.ts !== _revFlowTs) {
                _revFlowTs = obj.ts;
                GM_setValue('cpt_elig_flow_start', obj);
            }
        } catch(e) {}
    }, 250);

    // 7) Scorecard filtre isteği (sendScorecardUrlSignal) → GM (250ms)
    let _revUrlReqTs = 0;
    setInterval(() => {
        try {
            const raw = localStorage.getItem('cpt_scorecard_url_request');
            if (!raw) return;
            const obj = JSON.parse(raw);
            if (obj?.ts && obj.ts !== _revUrlReqTs) {
                _revUrlReqTs = obj.ts;
                GM_setValue('cpt_scorecard_url_request_gm', obj);
            }
        } catch(e) {}
    }, 250);

    try { console.log('[CPT BRIDGE] ters köprü aktif (site→GM: vardiya/yenile/atama sinyalleri)'); } catch(e) {}
}

// Oto yenileme açık mı
function autoRefreshOn() {
    try {
        const f = localStorage.getItem('cpt_auto_refresh_flag');
        return f !== null ? f !== '0' : GM_getValue('cpt_auto_refresh_flag','1') !== '0';
    } catch(e) { return true; }
}

// DOM observer yardımcısı
function observeTbody(fn, delay) {
    function attach() {
        const tb = document.querySelector('tbody');
        if(tb) {
            const obs = new MutationObserver(() => { clearTimeout(obs._t); obs._t = setTimeout(fn, delay||200); });
            obs.observe(tb, { childList: true, subtree: true });
        } else setTimeout(attach, 500);
    }
    attach();
}

// GM_xmlhttpRequest wrapper — promise + timeout
function gmFetch(url, opts) {
    return new Promise(resolve => {
        const _short = url.substring(0,100);
        const timer = setTimeout(() => {
            if(opts?.debug) { console.warn('[gmFetch TIMEOUT]', url); dlog('⏱️ gmFetch TIMEOUT', _short); }
            resolve(null);
        }, (opts?.timeout||10000));
        // v11.31: method + body desteği. Scorecard API POST gerektiriyor (GET → 404).
        const req = {
            method: opts?.method || 'GET',
            url,
            headers: opts?.json ? { Accept:'application/json', 'Content-Type':'application/json' } : (opts?.headers || {}),
            onload(r) {
                clearTimeout(timer);
                if(opts?.debug) {
                    console.log('[gmFetch]', url.substring(0,80), '→', r.status, 'len:', (r.responseText||'').length);
                    dlog('🌐 gmFetch', _short, '→ HTTP', r.status, 'len:', (r.responseText||'').length);
                }
                // 2xx ve 3xx kabul (final 200 dönerken bazen 304 olabiliyor)
                resolve((r.status >= 200 && r.status < 400) ? r : null);
            },
            onerror(e) {
                clearTimeout(timer);
                if(opts?.debug) { console.warn('[gmFetch ERROR]', url, e); dlog('❌ gmFetch ERROR', _short, String(e?.error||e||'')); }
                resolve(null);
            },
            ontimeout() {
                if(opts?.debug) console.warn('[gmFetch TIMEOUT]', url);
                resolve(null);
            }
        };
        if (opts?.body != null) req.data = opts.body;
        GM_xmlhttpRequest(req);
    });
}

// HTML parse helper
function parseHTML(html) {
    return new DOMParser().parseFromString(html, 'text/html');
}

// ════════════════════════════════════════════════════════
// v10.31: Sortation Buffer API fetcher
// DOM scrape değil — direkt JSON endpoint. Herhangi bir sayfadan çalışır.
const BATCH_DETAIL_URL_BASE = 'https://flow-sortation-eu.amazon.com/IST2/buffer/batch-details/';
const FC_WAREHOUSE = 'IST2';
const FC_HOURS_LOOKBACK = 4;  // 4 saat geriye bak

// JSON içinde array bul (response yapısı değişirse fallback)
function _findArrayInObj(obj, d) {
    d = d || 0;
    if (d > 5) return [];
    if (Array.isArray(obj)) return obj;
    if (typeof obj !== 'object' || !obj) return [];
    for (const k of Object.keys(obj)) {
        if (Array.isArray(obj[k]) && obj[k].length && typeof obj[k][0] === 'object') return obj[k];
    }
    for (const k of Object.keys(obj)) {
        if (typeof obj[k] === 'object') {
            const r = _findArrayInObj(obj[k], d + 1);
            if (r.length) return r;
        }
    }
    return [];
}

// Tek bir batch'in detay sayfasını fetch et — Angular SPA olduğu için iframe tekniği
// Detail sayfası JS ile tablo dolduruyor → görünmez iframe aç, Angular render etsin, sonra parse et
// Return: { totes: [{toteId}, ...] } veya null
async function fetchBatchDetail(batchId) {
    return new Promise((resolve) => {
        try {
            const f = document.createElement('iframe');
            f.style.cssText = 'width:1px;height:1px;position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none';
            f.src = BATCH_DETAIL_URL_BASE + batchId;
            // BATCH_DETAIL_URL_BASE = '/IST2/buffer/batch-details/' ama Angular # ister
            // Yine de denenir — Angular router # ile veya direkt URL ile çalışabilir
            // Daha güvenli: # ile
            f.src = 'https://flow-sortation-eu.amazon.com/IST2/#/buffer/batch-details/' + batchId;
            document.body.appendChild(f);

            let resolved = false;
            const finish = (result) => {
                if (resolved) return;
                resolved = true;
                try { f.remove(); } catch(e) {}
                resolve(result);
            };

            // Maks 12 saniye bekle
            const timeoutId = setTimeout(() => finish({ totes: [] }), 12000);

            // Polling: her 500ms tabloyu kontrol et
            let attempts = 0;
            const maxAttempts = 20; // 20 × 500ms = 10sn
            const poll = () => {
                attempts++;
                try {
                    const doc = f.contentDocument || f.contentWindow.document;
                    const tbl = doc && doc.getElementById('missed-totes');
                    if (tbl) {
                        const rows = tbl.querySelectorAll('tbody tr');
                        // tbody'de header satırı da olabilir (th'li); sadece tote'lu satırları al
                        const totes = [];
                        rows.forEach(r => {
                            const a = r.querySelector('a');
                            const td = r.querySelector('td');
                            if (a) {
                                const id = a.textContent.trim();
                                if (/^ts/i.test(id)) {
                                    totes.push({ toteId: id, location: '', lastPick: '', employee: '', units: 0, dwellMin: 0, dwellStr: '', source: 'sortation' });
                                }
                            } else if (td) {
                                // Belki link yok, sadece text
                                const txt = td.textContent.trim();
                                const m = txt.match(/\b(ts[A-Z0-9]+)\b/i);
                                if (m) {
                                    totes.push({ toteId: m[1], location: '', lastPick: '', employee: '', units: 0, dwellMin: 0, dwellStr: '', source: 'sortation' });
                                }
                            }
                        });

                        // Eğer satır var ama tote yoksa (sadece header) — boş Buffered Totes durumu olabilir
                        // Ya da gerçekten dolu mu kontrol et: en az 1 tote bulduysak veya 5+ deneme yaptıysak bitir
                        if (totes.length > 0 || attempts >= 8) {
                            clearTimeout(timeoutId);
                            finish({ totes });
                            return;
                        }
                    }
                } catch(e) {
                    // contentDocument cross-origin değilse erişilebilir olmalı
                }

                if (attempts >= maxAttempts) {
                    clearTimeout(timeoutId);
                    finish({ totes: [] });
                    return;
                }
                setTimeout(poll, 500);
            };
            // iframe yüklenmesi için ilk 1.5 saniye bekle, sonra polling başlat
            setTimeout(poll, 1500);

        } catch(e) {
            resolve(null);
        }
    });
}

// FCResearch'den tote için employee + last pick lokasyonu çek
function _buildFcUrl(toteId) {
    const t1 = Math.floor(Date.now() / 1000), t2 = t1 - FC_HOURS_LOOKBACK * 3600;
    return 'https://fcresearch-eu.aka.amazon.com/' + FC_WAREHOUSE +
        '/results/inventory-history-more?token={"request":{"warehouseId":"' + FC_WAREHOUSE +
        '","searchString":"' + toteId + '","startSearchDateUtc":' + t2 +
        ',"endSearchDateUtc":' + t1 + ',"nextToken":"{\\"query\\":{\\"containerScannableId\\":\\"' +
        toteId + '\\",\\"warehouseId\\":\\"' + FC_WAREHOUSE + '\\",\\"startRange\\":' + t2 +
        ',\\"endRange\\":' + t1 + '},\\"firstResult\\":0,\\"hasNext\\":true,\\"isSourceContainerSearchComplete\\":true}"},"totalRecordCount":1}';
}
function _isRealPickLocation(s) {
    if (!s) return false;
    return /^P-\d+-[A-Z0-9]/i.test(String(s).trim());
}
async function fetchFcInfo(toteId) {
    return new Promise((resolve) => {
        try {
            GM_xmlhttpRequest({
                method: 'GET',
                url: _buildFcUrl(toteId),
                timeout: 5000,
                onload(r) {
                    if (!r || r.status !== 200) return resolve({ employee: '', lastPick: '' });
                    const doc = new DOMParser().parseFromString(r.responseText, 'text/html');
                    let employee = '', lastPick = '';
                    for (const table of doc.querySelectorAll('table')) {
                        let headerTr = null, L = null;
                        for (const tr of table.querySelectorAll('tr')) {
                            const ths = [...tr.querySelectorAll('th')];
                            if (!ths.length) continue;
                            const labels = ths.map(th => th.textContent.trim().toLowerCase());
                            const iE = labels.findIndex(x => x.includes('employee') || x.includes('associate') || x.includes('login') || x.includes('picker'));
                            const iL = labels.findIndex(x => x.includes('lastpick') || x.includes('last pick') || x.includes('pick location') || x.includes('location'));
                            if (iE >= 0 && iL >= 0) { headerTr = tr; L = labels; break; }
                        }
                        if (!headerTr || !L) continue;
                        const iE = L.findIndex(x => x.includes('employee') || x.includes('associate') || x.includes('login') || x.includes('picker'));
                        const iL = L.findIndex(x => x.includes('lastpick') || x.includes('last pick') || x.includes('pick location') || x.includes('location'));
                        const bodyRows = [...table.querySelectorAll('tbody tr')];
                        for (const row of bodyRows) {
                            const tds = [...row.querySelectorAll('td')];
                            if (tds.length <= Math.max(iE, iL)) continue;
                            const emp = (tds[iE]?.textContent || '').trim();
                            const loc = (tds[iL]?.textContent || '').trim();
                            if (!employee && emp) employee = emp;
                            if (!lastPick && _isRealPickLocation(loc)) lastPick = loc;
                            if (employee && lastPick) break;
                        }
                        if (employee || lastPick) break;
                    }
                    resolve({ employee, lastPick });
                },
                onerror() { resolve({ employee: '', lastPick: '' }); },
                ontimeout() { resolve({ employee: '', lastPick: '' }); }
            });
        } catch(e) { resolve({ employee: '', lastPick: '' }); }
    });
}

// Concurrent FC enrichment — semaphore ile sınırlı
async function _enrichTotesWithFc(totes, maxConcurrent) {
    maxConcurrent = maxConcurrent || 4;
    const queue = totes.slice();
    let active = 0, idx = 0;
    return new Promise((resolveAll) => {
        function next() {
            while (active < maxConcurrent && queue.length) {
                const tote = queue.shift();
                idx++;
                active++;
                fetchFcInfo(tote.toteId).then(info => {
                    // Sadece FC'den yeni picker/lastPick gelirse override et
                    if (info.employee && !tote.employee) tote.employee = info.employee;
                    if (info.lastPick && !_isRealPickLocation(tote.lastPick)) tote.lastPick = info.lastPick;
                    active--;
                    if (!queue.length && active === 0) resolveAll();
                    else next();
                });
            }
            if (!queue.length && active === 0) resolveAll();
        }
        if (!totes.length) return resolveAll();
        next();
    });
}



// Timestamp → HH:MM
function tsToHHMM(ts) {
    if(!ts) return '';
    const d = new Date(ts);
    return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

// ════════════════════════════════════════════════════════
//  FILE:// — GM → localStorage köprüsü
// ════════════════════════════════════════════════════════
if (IS_FILE) {
    // v10.33: Cache migration — eski Sortation cache'lerini sıfırla
    // v10.31 öncesinden kalan API verisi + eski tote detay cache silinir
    try {
        const raw = localStorage.getItem('cpt_complete_batches_v1');
        if (raw) {
            const parsed = JSON.parse(raw);
            const arr = parsed?.allData || parsed?.data || [];
            if (Array.isArray(arr) && arr.length > 0) {
                const withCpt = arr.filter(b => b && b.cptTs > 0).length;
                if (withCpt === 0) {
                    localStorage.removeItem('cpt_complete_batches_v1');
                    console.log('[CPT v10.33] 🧹 Eski sağlıksız Sortation cache silindi (' + arr.length + ' batch, CPT yoktu)');
                }
            }
        }
        // v10.33: Tote detay cache'i artık kullanılmıyor, varsa sil
        if (localStorage.getItem('cpt_batch_totes_v1')) {
            localStorage.removeItem('cpt_batch_totes_v1');
            console.log('[CPT v10.33] 🧹 Kullanılmayan tote detay cache silindi');
        }
    } catch(e) {}

    const KEYS = [
        'cpt_scanner_v9','cpt_workforce_v9',
        'cpt_picker_counts_v9','cpt_scorecard_v9','cpt_individual_rates_v9',
        'cpt_transit_batches_v9','cpt_not_yet_picked_v9','cpt_scanner_cpt_v9','cpt_pick_areas_v9',
        'cpt_complete_batches_v1','cpt_path_plan_v1','cpt_eligibility_v1'
    ];

    // BroadcastChannel'dan anlık güncelle
    try {
        const b = new BroadcastChannel('cpt_data');
        b.onmessage = ({ data: d }) => {
            if(d?.key === 'cpt_cache_cleared_signal') {
                // v10.19: Tampermonkey "Tüm CPT cache temizle" komutu çalıştırıldı
                // → localStorage'daki tüm cpt_* anahtarlarını sil
                try {
                    const removed = [];
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                        const k = localStorage.key(i);
                        if (k && k.startsWith('cpt_') && k !== 'cpt_cache_cleared_signal' &&
                            k !== 'cpt_auto_refresh_flag' && k !== 'cpt_shift_saved' &&
                            k !== 'cpt_az_view' && !k.endsWith('_settings')) {
                            localStorage.removeItem(k);
                            removed.push(k);
                        }
                    }
                    console.log('[CPT10 FILE] cache cleared signal → removed', removed.length, 'keys');
                    window.dispatchEvent(new Event('cpt_data_updated'));
                } catch(e) {}
                return;
            }
            if(d?.key && d?.value) {
                try { localStorage.setItem(d.key, d.value); } catch(e) {}
                window.dispatchEvent(new Event('cpt_data_updated'));
            }
        };
    } catch(e) {}

    // Periyodik sync (BC olmayan durum için yedek)
    function syncGM() {
        let changed = false;
        KEYS.forEach(key => {
            try {
                let val = key==='cpt_scanner_v9'
                    ? (GM_getValue('cpt_wf_scanner_v9',null) || GM_getValue(key,null))
                    : GM_getValue(key,null);
                if(!val) return;
                // Her zaman string'e çevir
                const s = typeof val==='string' ? val : JSON.stringify(val);
                // Geçerli JSON mı kontrol et
                try { JSON.parse(s); } catch(e) { return; }
                if(localStorage.getItem(key) !== s) {
                    localStorage.setItem(key, s);
                    changed = true;
                }
            } catch(e) {}
        });
        if(changed) window.dispatchEvent(new Event('cpt_data_updated'));
    }
    syncGM();
    setInterval(syncGM, 800);
    // Anında tepki için storage event'i de dinle
    window.addEventListener('storage', e => { if(e.key && e.key.startsWith('cpt_')) syncGM(); });

    // Refresh & flag sinyali
    let _sig = '';
    setInterval(() => {
        try {
            const s = localStorage.getItem('cpt_refresh_workforce')||'';
            if(s && s!==_sig) { _sig=s; GM_setValue('cpt_refresh_signal',s); }
            const f = localStorage.getItem('cpt_auto_refresh_flag');
            if(f!==null) GM_setValue('cpt_auto_refresh_flag',f);
        } catch(e) {}
    }, 1000);

    // Shift request köprüsü: localStorage → GM (workforce sayfası okur)
    let _lastShiftTs = 0;
    let _lastSavedShift = '';
    let _lastShiftRespTs = 0;
    setInterval(() => {
        try {
            const req = localStorage.getItem('cpt_shift_request');
            if(req) {
                const obj = JSON.parse(req);
                if(obj.ts && obj.ts !== _lastShiftTs) {
                    _lastShiftTs = obj.ts;
                    GM_setValue('cpt_shift_request_gm', obj);
                }
            }
            // Cevap geldi mi? GM → localStorage (sadece yeni cevapsa)
            const resp = GM_getValue('cpt_shift_scorecard_gm', null);
            if(resp) {
                const respObj = typeof resp==='string' ? JSON.parse(resp) : resp;
                if(respObj.ts && respObj.ts !== _lastShiftRespTs) {
                    _lastShiftRespTs = respObj.ts;
                    localStorage.setItem('cpt_shift_scorecard', JSON.stringify(respObj));
                    window.dispatchEvent(new Event('cpt_data_updated'));
                }
            }
        } catch(e) {}
    }, 250);

    // cpt_shift_saved köprüsü: HTML'deki seçim → GM (scorecard sayfası okur)
    setInterval(() => {
        try {
            const saved = localStorage.getItem('cpt_shift_saved') || '';
            if(saved !== _lastSavedShift) {
                _lastSavedShift = saved;
                if(saved) GM_setValue('cpt_shift_saved_gm', saved);
                else if(typeof GM_deleteValue==='function') GM_deleteValue('cpt_shift_saved_gm');
            }
        } catch(e) {}
    }, 500);

    // v10.21: cpt_force_fetch köprüsü — HTML'den (file://) Amazon sayfalarına
    // 60sn auto-refresh sayacı veya manuel tıklama force-fetch sinyali yazar.
    // Bu köprü o sinyali GM storage'a yansıtır, Pick Workforce sayfası okur ve tetikler.
    let _lastForceFetchBridge = 0;
    setInterval(() => {
        try {
            const raw = localStorage.getItem('cpt_force_fetch');
            if (!raw) return;
            const obj = JSON.parse(raw);
            if (obj?.ts && obj.ts !== _lastForceFetchBridge) {
                _lastForceFetchBridge = obj.ts;
                GM_setValue('cpt_force_fetch_gm', obj);
            }
        } catch(e) {}
    }, 250);

    // v11.19: cpt_assign_moves_v1 köprüsü — HTML (file://) Picker Atama'da drag&drop ile
    // kuyruğa yazar; eligibility sayfası (https://) GM'den okur. file:// ile https:// origin'leri
    // ayrı localStorage kullandığı için GM köprüsü şart. Çift yönlü:
    //   - localStorage → GM: HTML değişikliği eligibility'ye gitsin
    //   - GM → localStorage: eligibility tarafı queue'yu temizlerse HTML de görsün
    let _lastAsgLocal = '';
    let _lastAsgGM = '';
    setInterval(() => {
        try {
            const local = localStorage.getItem('cpt_assign_moves_v1') || '';
            const gmRaw = GM_getValue('cpt_assign_moves_v1', null);
            const gm = gmRaw == null ? '' : (typeof gmRaw === 'string' ? gmRaw : JSON.stringify(gmRaw));
            // localStorage değişti → GM'e yaz
            if (local !== _lastAsgLocal) {
                _lastAsgLocal = local;
                if (local) GM_setValue('cpt_assign_moves_v1', local);
                else if (typeof GM_deleteValue === 'function') { try { GM_deleteValue('cpt_assign_moves_v1'); } catch(e){} GM_setValue('cpt_assign_moves_v1', ''); }
                else GM_setValue('cpt_assign_moves_v1', '');
                _lastAsgGM = local;
            }
            // GM değişti (başka sekme/eligibility) → localStorage'a yaz
            else if (gm !== _lastAsgGM) {
                _lastAsgGM = gm;
                if (gm && gm !== local) {
                    localStorage.setItem('cpt_assign_moves_v1', gm);
                    _lastAsgLocal = gm;
                    window.dispatchEvent(new Event('cpt_data_updated'));
                } else if (!gm && local) {
                    localStorage.removeItem('cpt_assign_moves_v1');
                    _lastAsgLocal = '';
                    window.dispatchEvent(new Event('cpt_data_updated'));
                }
            }
        } catch(e) {}
    }, 300);

    // v11.36: cpt_elig_flow_start köprüsü — HTML'deki "Atamayı Başlat" butonu
    // localStorage'a {ts} yazınca GM'e taşı. Eligibility sekmesi GM'den okuyup akışı tetikler.
    let _lastFlowStartBridge = 0;
    setInterval(() => {
        try {
            const raw = localStorage.getItem('cpt_elig_flow_start');
            if (!raw) return;
            const obj = JSON.parse(raw);
            if (obj?.ts && obj.ts !== _lastFlowStartBridge) {
                _lastFlowStartBridge = obj.ts;
                GM_setValue('cpt_elig_flow_start', obj);
            }
        } catch(e) {}
    }, 250);

    return;
}

// ════════════════════════════════════════════════════════
//  FANS — mesaj otomasyonu
// ════════════════════════════════════════════════════════
if (IS_FANS) {
    const sleep = ms => new Promise(r => setTimeout(r,ms));
    function nativeSet(el, val) {
        const p = el.tagName==='TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(p,'value').set.call(el,val);
    }
    function fire(el,t) { el.dispatchEvent(new Event(t,{bubbles:true})); }
    async function typeLike(el,text) {
        el.focus(); nativeSet(el,''); fire(el,'input'); fire(el,'change');
        for(const ch of text) { nativeSet(el,el.value+ch); fire(el,'input'); await sleep(5); }
        fire(el,'change');
    }
    async function fill() {
        const q = new URLSearchParams(location.search);
        const to=q.get('cpt_to')||'', msg=q.get('cpt_msg')||'';
        const ts=parseInt(q.get('cpt_ts')||'0');
        if(!to||!msg||(ts&&Date.now()-ts>30000)) return;

        function findTo() {
            return document.getElementById('sendMessageTo')
                || document.querySelector('input[name="to"]')
                || [...document.querySelectorAll('input[type="text"],input:not([type])')].find(el=>{
                    const r=el.closest('tr'); return r&&r.textContent.toLowerCase().includes('to');
                }) || document.querySelectorAll('input[type="text"]')[1] || null;
        }
        function findTA() {
            const tas=[...document.querySelectorAll('textarea')];
            return document.querySelector('textarea[data-testid="message-text"]')
                || document.querySelector('textarea[name="messageText"]')
                || (tas.length ? tas.reduce((a,b)=>{
                    const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();
                    return ra.width*ra.height>rb.width*rb.height?a:b;
                }) : null);
        }
        let toEl=null,taEl=null;
        for(let i=0;i<50;i++) { toEl=findTo(); taEl=findTA(); if(toEl&&taEl) break; await sleep(300); }
        if(!toEl||!taEl) return;
        await typeLike(toEl,to);
        await typeLike(taEl,msg);
        taEl.focus();

        // ─── OTOMATIK GÖNDER ───────────────────────────────────────
        // Form dolduktan sonra "Send" / "Gönder" butonunu bul ve tıkla.
        function findSendBtn() {
            // Önce belirgin selector'ları dene
            const direct = document.querySelector('button[data-testid*="send"]')
                       || document.querySelector('button[name*="send" i]')
                       || document.querySelector('input[type="submit"]');
            if (direct) return direct;
            // Sonra metne göre ara — Send / Gönder / Submit
            const all = [...document.querySelectorAll('button, input[type="button"], input[type="submit"]')];
            return all.find(b => {
                const txt = (b.textContent || b.value || '').trim().toLowerCase();
                return /^(send|gönder|gonder|submit)\b/i.test(txt);
            }) || null;
        }
        // Kısa bekle (form change event'leri tamamlansın), sonra gönder
        await sleep(400);
        let sendBtn = findSendBtn();
        // Yoksa biraz daha bekle — sayfa hâlâ yükleniyor olabilir
        for (let i = 0; i < 10 && !sendBtn; i++) { await sleep(200); sendBtn = findSendBtn(); }

        const banner = document.createElement('div');
        banner.style.cssText = 'position:fixed;top:16px;right:16px;background:#16a34a;color:#fff;padding:10px 16px;border-radius:10px;font-size:13px;z-index:999999;font-family:sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.3)';

        if (sendBtn && !sendBtn.disabled) {
            // Otomatik gönder
            sendBtn.click();
            banner.textContent = `📤 ${to.includes(' ') ? to.split(' ').length + ' picker' : to} → gönderildi ✅`;
            // 2 saniye sonra pencereyi kapat (sayfa zaten "sent" diyecek)
            setTimeout(() => {
                try { window.close(); } catch(e) {}
            }, 1500);
        } else {
            // Send butonu bulunamadıysa eskisi gibi sadece hazır göster
            banner.textContent = `✅ ${to.includes(' ') ? to.split(' ').length + ' picker' : to} → hazır (Send butonuna bas)`;
            banner.style.background = '#1a6ef5';
        }
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 4000);
    }
    if(document.readyState==='complete') setTimeout(fill,800);
    else window.addEventListener('load',()=>setTimeout(fill,800));
    return;
}

// ═══════════════════════════════════════════════════════════════
//  v10.38: SORTATION VERİ ÇEKİCİ — Picking Console'dan tetiklenir
//  Sortation Buffer Current Status API'sini GM_xmlhttpRequest ile çağırır.
//  CORS bypass + cookie paylaşımı (Tampermonkey yetkisi).
//  Pick Console sayfası açık olduğu sürece her 30sn'de bir veri çeker.
//
//  API field schema (gerçek):
//    batchID, bufferScannableID, needByDateUTC (epoch SEC),
//    pickStatus, bufferStatus, sortCode, site, assignmentDateUTC
// ═══════════════════════════════════════════════════════════════
if (IS_PICKING && !IS_IFRAME) {
    const SORT_API_URL = 'https://flow-sortation-eu.amazon.com/IST2/batch-buffer/current-status';

    function fetchSortationFromPickConsole() {
        return new Promise((resolve) => {
            const t0 = Date.now();
            try {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: SORT_API_URL,
                    headers: { 'Accept': 'application/json' },
                    timeout: 12000,
                    onload(r) {
                        const dt = Math.round((Date.now() - t0)/100)/10;
                        if (r.status !== 200) {
                            dlog(`🌐 Sortation API HTTP ${r.status} (${dt}sn)`);
                            return resolve(null);
                        }
                        let json;
                        try { json = JSON.parse(r.responseText); }
                        catch(e) { dlog('🌐 Sortation API JSON parse hatası'); return resolve(null); }

                        const list = json.batchSummaries || json.batches || [];
                        if (!Array.isArray(list) || !list.length) {
                            dlog(`🌐 Sortation API: liste boş (${dt}sn)`);
                            return resolve(null);
                        }

                        const all = list.map(b => {
                            // needByDateUTC: epoch SECONDS (örn 1779278400 = 2026-05-20 15:00 UTC)
                            const exsdSec = +(b.needByDateUTC || b.needByDate || 0);
                            const cptTs = exsdSec > 0 ? Math.round(exsdSec * 1000) : 0;
                            let cptLabel = '';
                            if (cptTs > 0) {
                                const d = new Date(cptTs);
                                cptLabel = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
                            }
                            return {
                                batchId:    String(b.batchID || b.batchId || ''),
                                buffer:     String(b.bufferScannableID || ''),
                                cptTs, cptLabel,
                                hhmmLeft:   '',
                                pickStatus: String(b.pickStatus || ''),
                                buffStatus: String(b.bufferStatus || ''),
                                sortCode:   String(b.sortCode || ''),
                                totalU: 0, cptU: 0, pnyp: 0, totes: 0
                            };
                        }).filter(b => b.batchId && /^\d+$/.test(b.batchId));

                        const withCpt = all.filter(b => b.cptTs > 0).length;
                        if (withCpt === 0) {
                            dlog(`🌐 Sortation API: ${all.length} batch ama HİÇ CPT yok (${dt}sn)`);
                            return resolve(null);
                        }

                        const completeBatches = all.filter(b => b.pickStatus === 'PickComplete');
                        const payload = {
                            data: completeBatches,
                            allData: all,
                            totalComplete: completeBatches.length,
                            extras: { source: 'pick-console-api' },
                            ts: Date.now()
                        };

                        push('cpt_complete_batches_v1', payload);
                        dlog(`🌐 Sortation API ✓ ${all.length} batch (${withCpt} CPT'li) ${dt}sn`);
                        resolve(payload);
                    },
                    onerror(e) { dlog('🌐 Sortation API error:', e?.error || e); resolve(null); },
                    ontimeout() { dlog('🌐 Sortation API timeout'); resolve(null); }
                });
            } catch(e) {
                dlog('🌐 Sortation API exception:', String(e).substring(0,100));
                resolve(null);
            }
        });
    }

    // Pick Console'da userscript yüklendikten 3sn sonra ilk fetch
    setTimeout(() => fetchSortationFromPickConsole(), 3000);
    // Sonra her 30 saniyede bir
    setInterval(() => fetchSortationFromPickConsole(), 30000);
    // v10.59: Arka plan throttling'e karşı — sekme görünür/focus olunca taze fetch.
    // Kullanıcı Pick Console sekmesine her dönüşünde güncel Sortation verisi gelir.
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) setTimeout(() => fetchSortationFromPickConsole(), 150);
    });
    window.addEventListener('focus', () => { setTimeout(() => fetchSortationFromPickConsole(), 150); });
    window.addEventListener('pageshow', () => { setTimeout(() => fetchSortationFromPickConsole(), 300); });

    // ── v11.14: Pick Console "Process Path" tabloları (NWD/TSO/VR…) ──
    // TUR Picker = istenen plan, Active Picker = mevcut. Sağlam kazıma:
    //  (1) sayfadaki TÜM process-path tablolarını tara — sadece id="TableProcessPath" değil
    //  (2) Active/TUR/Batch sütununu BAŞLIK metninden bul (sabit index değil)
    //  (3) sayıyı boşlukları silerek ayrıştır ("1 5"/"15\n" → 15)
    //  (4) ne çekildiğini konsola logla (PP=tur) — teşhis için
    function _ppNum(txt) {
        const s = String(txt || '').replace(/\s+/g, '').replace(',', '.').replace(/[^\d.]/g, '');
        const n = parseFloat(s);
        return isNaN(n) ? null : n;
    }
    function _ppColIdx(headerRow) {
        const idx = { active: -1, tur: -1, batch: -1 };
        const cells = headerRow ? headerRow.children : [];
        for (let i = 0; i < cells.length; i++) {
            const t = (cells[i].textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
            if (idx.tur    < 0 && /tur/.test(t)    && /picker/.test(t)) idx.tur = i;
            if (idx.active < 0 && /active/.test(t) && /picker/.test(t)) idx.active = i;
            if (idx.batch  < 0 && /batch/.test(t))                      idx.batch = i;
        }
        return idx;
    }
    function harvestProcessPathPlan() {
        try {
            const tables = [];
            const byId = document.getElementById('TableProcessPath');
            if (byId) tables.push(byId);
            document.querySelectorAll('table').forEach(tb => {
                if (tables.indexOf(tb) >= 0) return;
                const hr = tb.querySelector('tr');
                const ht = hr ? (hr.textContent || '') : '';
                if (/tur/i.test(ht) && /picker/i.test(ht) && /active/i.test(ht)) tables.push(tb);
            });
            const plan = {};
            tables.forEach(table => {
                const rows = table.querySelectorAll('tr');
                if (!rows.length) return;
                const col = _ppColIdx(rows[0]);
                if (col.tur < 0) return;   // TUR Picker sütunu yok → bu tabloyu atla
                rows.forEach((tr, ri) => {
                    if (ri === 0) return;  // başlık satırı
                    const tds = tr.querySelectorAll('td');
                    if (tds.length <= col.tur) return;
                    const nameRaw = (tds[0].textContent || '').trim();
                    if (!nameRaw || /^(total|inactive)$/i.test(nameRaw)) return;
                    let ppKey = '';
                    const gear = tr.querySelector('a[href*="/process-path/"]');
                    if (gear) { const m = (gear.getAttribute('href') || '').match(/\/process-path\/(PP[A-Za-z0-9_]+)/); if (m) ppKey = m[1]; }
                    if (!ppKey) ppKey = 'PP' + nameRaw.replace(/\s+/g, '');
                    const tur    = _ppNum(tds[col.tur].textContent);
                    const active = col.active >= 0 ? _ppNum(tds[col.active].textContent) : null;
                    const batch  = (col.batch >= 0 && tds[col.batch]) ? (tds[col.batch].textContent || '').trim() : '';
                    const prev = plan[ppKey];
                    if (!prev || (prev.tur == null && tur != null)) {   // null'la ezme; dolu tur'u koru
                        plan[ppKey] = { name: nameRaw, active, tur, batch };
                    }
                });
            });
            if (Object.keys(plan).length) {
                push('cpt_path_plan_v1', { plan, ts: Date.now() });
                dlog('📋 Process Path planı çekildi: ' + Object.keys(plan).length + ' PP · ' +
                     Object.keys(plan).map(k => k.replace(/^PP/, '') + '=' + (plan[k].tur == null ? '?' : plan[k].tur)).join(' '));
            }
        } catch(e) { dlog('Process Path harvest hata:', String(e).substring(0, 80)); }
    }
    setTimeout(harvestProcessPathPlan, 3500);
    setInterval(harvestProcessPathPlan, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(harvestProcessPathPlan, 200); });
    window.addEventListener('focus', () => { setTimeout(harvestProcessPathPlan, 200); });

    // Tampermonkey menüsünden manuel tetikleme
    try {
        if (typeof GM_registerMenuCommand === 'function') {
            GM_registerMenuCommand('📦 Sortation veri çek (manuel)', async () => {
                const r = await fetchSortationFromPickConsole();
                if (r) alert('✓ ' + r.allData.length + ' batch çekildi (' + r.allData.filter(b=>b.cptTs>0).length + ' CPT li)');
                else alert('❌ Sortation API\'dan veri alınamadı. Console\'a bak.');
            });
        }
    } catch(e) {}

    dlog('🟢 Sortation API fetcher aktif (Pick Console üzerinden, 30sn aralık)');
}

// ════════════════════════════════════════════════════════
//  WORKFORCE — ana veri merkezi
// ════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════
//  v12.44 — PICKING CONSOLE OTOMATİK KURULUM + GEZİNME (iframe)
//  Kullanıcı isteği: workforce'a girince, script kendisi (mouse ile yapar gibi)
//  Areas C4 ve Scorecard sayfalarına GEÇER, ayarları yapar, kapatır — kullanıcı
//  o sayfalara hiç girmeden. Gezinme görünmez iframe ile (Picking Console same-origin,
//  script iframe'de tekrar çalışır → kendi ayarını yapar).
//
//  Ayar reçeteleri (ekran görüntülerinden birebir):
//    • workforce: Page=All · KAPALI={Station ID, Workcell Type, Use UTC, Auto Refresh} · gerisi AÇIK
//    • pick-areas: Page=All · TÜM kolonlar AÇIK · +{Show Batch ID, Show Process Path} AÇIK
//    • scorecard:  Page=All · TÜM kolonlar AÇIK
//
//  TEK SEFERLİK: her sayfa bir kez ayarlanınca bayrak (cpt_pc_setup_{page}_v3) konur.
//    (Kullanıcı: "tekrar bozulursa kontrol et'e gerek yok" — self-heal YOK.)
//  Panel/öğe bulunamazsa SESSİZCE vazgeçer (hiçbir şeyi bozmaz).
// ════════════════════════════════════════════════════════

// ── Ortak ayar uygulayıcı: verilen document (ana sayfa VEYA iframe) içinde çalışır ──
function _pcApplySettings(doc, page, done){
    // page: 'wf' | 'pa' | 'sc'
    var OFF_COLUMNS = { wf: ['station id','workcell type'], pa: [], sc: [] }[page];
    var EXTRA_TOGGLES = { wf: [], pa: ['show batch id','show process path'], sc: [] }[page];
    // Panel dışı, sayfa gövdesindeki KAPALI yapılacak toggle'lar (metin → kapat)
    var OFF_BODY_TOGGLES = { wf: ['use utc','auto refresh'], pa: [], sc: [] }[page];

    var tries = 0, MAX = 40;
    function norm(s){ return (s||'').replace(/\s+/g,' ').trim().toLowerCase(); }
    // awsui switch/checkbox tıklama: TEK toggle garantisi. Bir yöntem dener, durum
    //   değiştiyse durur; değişmediyse sıradaki yöntemi dener (çift-tetik yok).
    function _swState(s){ return s.checked || s.getAttribute('aria-checked')==='true'; }
    function _clickSwitch(s){
        var before = _swState(s);
        // 1) doğrudan tıkla
        try { s.click(); } catch(e){}
        if (_swState(s) !== before) return true;
        // 2) görsel wrapper'a tıkla (gizli input durumunda)
        try {
            var w = s.closest('label') || s.closest('[class*="toggle"]') || s.closest('[class*="switch"]') || s.parentElement;
            if (w && w !== s) { w.click(); if (_swState(s) !== before) return true; }
        } catch(e){}
        // 3) native input event (ng/react two-way bind)
        try {
            if (s.tagName === 'INPUT') { s.checked = !before; s.dispatchEvent(new Event('change', {bubbles:true})); if (_swState(s) !== before) return true; }
        } catch(e){}
        // 4) pointer/mouse event dizisi (bazı awsui switch'leri click yerine bunu dinler)
        try {
            ['pointerdown','mousedown','mouseup','click'].forEach(function(t){ s.dispatchEvent(new MouseEvent(t, {bubbles:true, cancelable:true, view:window})); });
        } catch(e){}
        return _swState(s) !== before;
    }
    function q(sel){ return doc.querySelectorAll(sel); }
    function findByText(sel, rx){ var e=q(sel); for(var i=0;i<e.length;i++){ if(rx.test((e[i].textContent||'').trim())) return e[i]; } return null; }
    function vis(el){ return el && el.offsetParent !== null; }
    function findGear(){
        // 1) aria-label ile
        var g = doc.querySelector('button[aria-label*="preferences" i]')
             || doc.querySelector('button[aria-label*="settings" i]')
             || doc.querySelector('button[aria-label*="ayar" i]')
             || doc.querySelector('button[title*="preferences" i]')
             || doc.querySelector('button[title*="settings" i]');
        if (g) return g;
        // 2) awsui collection-preferences trigger (Cloudscape'in standart sınıfı)
        g = doc.querySelector('[class*="collection-preferences"] button')
         || doc.querySelector('button[class*="preferences"]')
         || doc.querySelector('.awsui-table-tools button:last-child, [class*="table-tools"] button:last-child');
        if (g && vis(g)) return g;
        // 3) İçinde dişli (gear/cog/settings) SVG olan buton — awsui ikon butonları aria-label'sız olabilir
        var btns = doc.querySelectorAll('button');
        for (var i=0;i<btns.length;i++){
            var b = btns[i];
            if (!vis(b)) continue;
            var svg = b.querySelector('svg');
            if (!svg) continue;
            var al = (b.getAttribute('aria-label')||'') + ' ' + (b.getAttribute('title')||'') + ' ' + (svg.getAttribute('aria-label')||'');
            if (/pref|setting|gear|cog|ayar/i.test(al)) return b;
            // ikon içeriği "settings" path'i mi (awsui settings ikonu)
            var use = svg.querySelector('use');
            if (use && /settings|gear|cog|preference/i.test(use.getAttribute('href')||use.getAttribute('xlink:href')||'')) return b;
        }
        // 4) tablonun sağ üstündeki son ikon-buton (genelde preferences orada)
        var toolbar = doc.querySelector('[class*="table-tools"], [class*="header-tools"], [class*="awsui_tools"]');
        if (toolbar){ var tb = toolbar.querySelectorAll('button'); if (tb.length){ var last=tb[tb.length-1]; if(vis(last)) return last; } }
        return null;
    }
    function setPageSizeAll(scope){
        var root=scope||doc; var labels=root.querySelectorAll('label,.awsui-radio-button,[class*="radio"]');
        var allL=null,maxN=-1,maxL=null;
        for(var i=0;i<labels.length;i++){ var t=(labels[i].textContent||'').trim();
            if(/^all$/i.test(t)||/\btümü\b/i.test(t)||/\bhepsi\b/i.test(t)){allL=labels[i];break;}
            var m=t.match(/^(\d{2,4})$/); if(m){var n=parseInt(m[1]); if(n>maxN){maxN=n;maxL=labels[i];}} }
        var tgt=allL||maxL;
        if(tgt){ var inp=tgt.querySelector('input')||tgt;
            var wasChecked = (inp.checked===true) || (tgt.getAttribute && tgt.getAttribute('aria-checked')==='true');
            if(!wasChecked){ try{inp.click();}catch(e){} return true; }   // sadece değiştirdiysek true
            return 'already';   // zaten All — değişiklik yok ama hata da yok
        }
        return false;
    }
    function applyColumns(scope){
        var root=scope||doc; var sw=root.querySelectorAll('[role="switch"],input[type="checkbox"]'); var ch=0;
        for(var i=0;i<sw.length;i++){ var s=sw[i]; if(!vis(s)) continue;
            var row=s.closest('label,li,tr,[class*="row"],[class*="option"],div'); var lt=row?norm(row.textContent):'';
            if(/wrap lines|sticky header|property key|column description|page size|^\d+$|^all$/.test(lt)) continue;
            var on=s.checked||s.getAttribute('aria-checked')==='true';
            var off=OFF_COLUMNS.some(function(o){return lt.indexOf(o)===0||lt===o;});
            if(off&&on){ _clickSwitch(s); ch++; } else if(!off&&!on){ _clickSwitch(s); ch++; } }
        return ch;
    }
    function confirmPanel(scope){ var b=findByText('button',/^\s*(confirm|apply|save|onayla|uygula|kaydet)\s*$/i); if(b&&vis(b)){try{b.click();return true;}catch(e){}} return false; }
    // metin → toggle'ı İSTENEN duruma getir (wantOn true=aç, false=kapat)
    function setToggleByText(txt, wantOn){
        var all=q('[role="switch"],input[type="checkbox"],label,span,div');
        for(var i=0;i<all.length;i++){ var nt=norm(all[i].textContent);
            if(nt===txt||nt.indexOf(txt)===0){
                var s=all[i].querySelector('[role="switch"],input[type="checkbox"]')
                    ||(all[i].closest('label,div,li')&&all[i].closest('label,div,li').querySelector('[role="switch"],input[type="checkbox"]'));
                if(s&&vis(s)){ var on=s.checked||s.getAttribute('aria-checked')==='true';
                    if(wantOn&&!on){ _clickSwitch(s); return true; }
                    if(!wantOn&&on){ _clickSwitch(s); return true; } }
                break; } }
        return false;
    }

    function attempt(){
        tries++;
        var ready = doc.querySelector('tr.awsui-table-row, table tbody tr, thead th[data-awsui-column-id]');
        if(!ready){ if(tries<MAX) return setTimeout(attempt,500); return done && done(false); }
        var gear=findGear();
        if(!vis(gear)){ if(tries<MAX) return setTimeout(attempt,500); dlog('⚙️ PC ['+page+'] panel yok, atlandı'); return done && done(false); }
        try{gear.click();}catch(e){}
        setTimeout(function(){
            var panel=doc.querySelector('[class*="modal"],[role="dialog"],[class*="preferences"]')||doc;
            var okSize=setPageSizeAll(panel); var nCol=applyColumns(panel);
            setTimeout(function(){
                var confd=confirmPanel(panel);
                setTimeout(function(){
                    // panel-dışı toggle'lar (Show Batch ID / Show Process Path = AÇ)
                    var nOn=0; EXTRA_TOGGLES.forEach(function(t){ if(setToggleByText(t,true)) nOn++; });
                    // panel-dışı KAPATılacaklar (Use UTC / Auto Refresh = KAPAT)
                    var nOff=0; OFF_BODY_TOGGLES.forEach(function(t){ if(setToggleByText(t,false)) nOff++; });
                    // Başarı: gerçek değişiklik yapıldı VEYA "zaten doğru ayarlı" (already + panel açıldı).
                    var didChange = (okSize===true)||nCol>0||confd||nOn>0||nOff>0;
                    var alreadyOk = (okSize==='already');   // panel açıldı, All zaten seçili
                    var okAny = didChange || alreadyOk;
                    dlog('✅ PC ['+page+'] size='+okSize+' kolon='+nCol+' onay='+confd+' aç='+nOn+' kapat='+nOff+' → '+(okAny?'OK':'BAŞARISIZ'));
                    done && done(okAny);
                },500);
            },400);
        },500);
    }
    setTimeout(attempt, 1200);
}

// ── iframe'de görünmez sayfa açıp ayarını yaptır ──
function _pcSetupViaIframe(url, page, cb){
    try {
        var f = document.createElement('iframe');
        f.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1400px;height:900px;border:0;opacity:0;pointer-events:none;visibility:hidden';
        f.src = url;
        document.body.appendChild(f);
        var doneOnce=false;
        function fin(ok){ if(doneOnce) return; doneOnce=true; try{f.remove();}catch(e){} cb && cb(ok); }
        var killer=setTimeout(function(){ dlog('⏱ PC ['+page+'] iframe timeout'); fin(false); }, 25000);
        f.addEventListener('load', function(){
            // iframe içindeki userscript instance'ı KENDİ ayarını yapar (IS_PICK_AREAS/IS_SCORECARD).
            // Ama emin olmak için ana sekmeden de iframe.doc üzerinde uygulayıcıyı çağırabiliriz.
            // Cross-instance karışmasın diye: iframe içindeki instance'a bırak, biz sadece bekle+kapat.
            setTimeout(function(){
                // iframe içindeki instance bayrağı koyduysa başarı say
                var ok=false;
                try { ok = (f.contentWindow && f.contentWindow.localStorage &&
                            f.contentWindow.localStorage.getItem('cpt_pc_setup_'+page+'_v4')==='done'); } catch(e){}
                clearTimeout(killer); fin(ok);
            }, 14000);   // iframe içi ayar ~12sn sürer, 14sn sonra kapat
        });
    } catch(e){ cb && cb(false); }
}

// ── ANA AKIŞ ──
(function _pcAutoOrchestrate(){
    var PC_BASE = 'https://picking-console.eu.picking.aft.a2z.com/fc/IST2';
    var URLS = { pa: PC_BASE + '/pick-areas-c4', sc: PC_BASE + '/reports/current-scorecard' };

    // 1) iframe İÇİNDEYSEK: sadece kendi sayfamızın ayarını yap, bayrak koy, dur.
    if (IS_IFRAME) {
        var pg = _PC_PATH_PA ? 'pa' : (_PC_PATH_SC ? 'sc' : (_PC_PATH_WF ? 'wf' : null));
        if (!pg) return;
        var fl = 'cpt_pc_setup_'+pg+'_v4';
        try { if (localStorage.getItem(fl)==='done') return; } catch(e){ return; }
        _pcApplySettings(document, pg, function(ok){ if(ok){ try{ localStorage.setItem(fl,'done'); }catch(e){} } });
        return;
    }

    // 2) ANA SEKME + WORKFORCE: kendi ayarını yap, sonra diğer 2 sayfayı iframe'de gez.
    if (!IS_WORKFORCE) return;
    // Zaten hepsi kurulduysa hiç uğraşma
    try {
        if (localStorage.getItem('cpt_pc_setup_wf_v4')==='done'
         && localStorage.getItem('cpt_pc_setup_pa_v4')==='done'
         && localStorage.getItem('cpt_pc_setup_sc_v4')==='done') return;
    } catch(e){ return; }

    // 2a) Workforce kendi ayarı
    _pcApplySettings(document, 'wf', function(ok){
        if(ok){ try{ localStorage.setItem('cpt_pc_setup_wf_v4','done'); }catch(e){} }

        // 2b) Areas C4 (gerekiyorsa) → sonra Scorecard (gerekiyorsa) → sıralı
        function doPA(next){
            var paDone=false; try{ paDone = localStorage.getItem('cpt_pc_setup_pa_v4')==='done'; }catch(e){}
            if(paDone) return next();
            dlog('➡️ PC oto: Areas C4 iframe açılıyor…');
            _pcSetupViaIframe(URLS.pa, 'pa', function(){ next(); });
        }
        function doSC(next){
            var scDone=false; try{ scDone = localStorage.getItem('cpt_pc_setup_sc_v4')==='done'; }catch(e){}
            if(scDone) return next();
            dlog('➡️ PC oto: Scorecard iframe açılıyor…');
            _pcSetupViaIframe(URLS.sc, 'sc', function(){ next(); });
        }
        // Sıralı çalıştır (aynı anda iki iframe açma — kaynak/oturum çakışmasın)
        doPA(function(){ doSC(function(){ dlog('🏁 PC oto-kurulum bitti — workforce aktif kalıyor'); }); });
    });
})();

if (IS_WORKFORCE && !IS_IFRAME) {   // v12.47: iframe'de bu blok çalışmaz (sonsuz reload/çift-çekim önlenir; ayar orkestratöre bırakılır)
    const MONTHS_TR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

    // v10.23: EMPTY-NEVER POLICY
    // Boş cevap geldiğinde cache'e ASLA dokunulmaz — eski dolu veri saklanmaya devam eder.
    // Kullanıcı asla "veri yok" mesajı görmez. Sadece "Xdk önce güncellendi" rozetiyle
    // verinin yaşı belirtilir. Önceki time-based guard ve empty:true yazımları kaldırıldı.
    let _lastGoodPushWf  = Date.now();
    let _lastGoodFetchWf = Date.now();
    let _lastGoodAreas   = Date.now();

    // Bilinen CPT saatleri — dakika cinsinden
    // v10.86: Rodeo ExSD'ye göre güncellendi. Yeni eklenenler: 02:50, 13:35, 15:05, 18:35, 23:20.
    // Eski gün-içi/Fracs saatleri (10:00, 18:00, 21:00) korundu (Rodeo penceresinde şu an
    // görünmese de o saatlerde geçerli olabilir). HTML'deki FIXED_CPT_TIMES ile BİREBİR aynı.
    const FIXED_CPT_MINS = [
        2*60+30,   // 02:30
        2*60+50,   // 02:50
        3*60+0,    // 03:00
        10*60+0,   // 10:00 (TSO - PPTransXTRD)
        13*60+30,  // 13:30
        13*60+35,  // 13:35
        15*60+0,   // 15:00
        15*60+5,   // 15:05
        18*60+0,   // 18:00 (Fracs)
        18*60+30,  // 18:30
        18*60+35,  // 18:35
        21*60+0,   // 21:00 (Fracs)
        23*60+20,  // 23:20
        23*60+30   // 23:30
    ];

    // Verilen timestamp'i en yakın FIXED_CPT saatine yuvarla (max 45dk tolerans)
    function snapToFixedCpt(ts) {
        if(!ts) return { cptTime:'', cptTs:null };
        const d = new Date(ts);
        const dayMins = d.getHours()*60 + d.getMinutes();

        let bestDiff = Infinity;
        let bestMins = null;
        FIXED_CPT_MINS.forEach(fixedMins => {
            // Aynı gün kontrolü
            let diff = Math.abs(dayMins - fixedMins);
            // Gece yarısı geçişi (örn: 23:45 → 00:30)
            diff = Math.min(diff, 24*60 - diff);
            if(diff < bestDiff) { bestDiff=diff; bestMins=fixedMins; }
        });

        // 45 dakikadan fazla uzaksa bu CPT saatine ait değil
        if(bestDiff > 45 || bestMins === null) return { cptTime:'', cptTs:null };

        const hh = Math.floor(bestMins/60);
        const mm = bestMins % 60;
        const snapped = new Date(ts);
        snapped.setHours(hh, mm, 0, 0);
        // Timestamp geçmişte kalıyorsa (gece geçişi) düzelt
        if(snapped.getTime() < ts - 23*3600000) snapped.setDate(snapped.getDate()+1);
        const cptTime = String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
        return { cptTime, cptTs: snapped.getTime() };
    }

    // Workforce tablo satırını parse et
    function parseRow(cells, now) {
        if(cells.length < 9) return null;
        const link = cells[1]?.querySelector('a');
        if(!link) return null;
        const lm = (link.getAttribute('href')||'').match(/\/picker\/([^/?]+)/);
        if(!lm) return null;
        const login = lm[1].toLowerCase();

        // ─── CPT KURAL ────────────────────────────────────────────
        // User Id'nin link text'inde parantez içinde CPT saati VAR ise picker'a
        // batch atanmıştır, o saat onun CPT'sidir.
        // YOK ise picker İŞSİZ (idle) — CPT atamayız.
        // Last Activity Time / Earliest ExSD gibi diğer sütunlardaki time
        // element'lerine ASLA bakmıyoruz — onlar yanıltıcı (en son okuttuğu ürün
        // saatine göre yuvarlanan eski CPT olabilir).
        // ──────────────────────────────────────────────────────────
        let rawTs = null;
        const txt = (link.textContent||'').replace(/\u00a0/g,' ');
        // CPT, login link'inde parantez içinde: SAAT zorunlu, TARİH varsa kesin kullanılır.
        // v11.13: tarih birçok formatta gelebilir → hepsini tanı. Tarih bulunursa TAHMİN YOK
        //   (eskiden yalnız "HH:MM DD/MM/YYYY" tanınıyordu; Amazon YYYY-MM-DD de kullanıyor).
        //   Desteklenen: DD/MM/YYYY · DD.MM.YYYY · DD-MM-YYYY · YYYY-MM-DD · YYYY/MM/DD · DD/MM/YY,
        //   saat tarihten önce ya da sonra fark etmez.
        const paren = txt.match(/\(([^)]*)\)/);
        const inner = paren ? paren[1].trim() : '';
        const tm = inner.match(/(\d{1,2}):(\d{2})/);
        if (tm) {
            const hh = +tm[1], mm = +tm[2];
            let Y=null, Mo=null, D=null, dm;
            if ((dm = inner.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/))) {            // YYYY-MM-DD
                Y=+dm[1]; Mo=+dm[2]; D=+dm[3];
            } else if ((dm = inner.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/))) {     // DD-MM-YYYY
                D=+dm[1]; Mo=+dm[2]; Y=+dm[3];
            } else if ((dm = inner.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})(?!\d)/))) { // DD-MM-YY
                D=+dm[1]; Mo=+dm[2]; Y=2000+(+dm[3]);
            }
            if (Y!=null && Mo>=1 && Mo<=12 && D>=1 && D<=31) {
                rawTs = new Date(Y, Mo-1, D, hh, mm).getTime();   // açık tarih → tahmin yok
            } else {
                // Sadece saat → tarihi şimdiden ileriye dönük tahmin et (24sa pencere, boşluksuz)
                const d = new Date(); d.setHours(hh, mm, 0, 0);
                rawTs = d.getTime();
                if (rawTs < now - 8*3600000)  rawTs += 86400000;
                if (rawTs > now + 16*3600000) rawTs -= 86400000;
            }
        }

        // Parantezde saat yoksa picker İŞSİZ → CPT boş
        // (FIXED CPT'lere yuvarlama yapma — onlar batch atandıysa anlamlı)
        const { cptTime, cptTs } = rawTs
            ? snapToFixedCpt(rawTs)
            : { cptTime: '', cptTs: null };

        // v11.51: Picker adı-soyadı. Workforce tablosunda User Id link'inde isim olabilir
        //   ("Zenginer,Sinan (23:20)") ya da ayrı Name kolonunda (cells[2]).
        //   Önce link text'inden parantezsiz kısmı dene, yoksa cells[2].
        let pName = '';
        const linkTxtClean = txt.replace(/\([^)]*\)/g, '').trim();   // parantez içini at
        // login değilse (içinde harf+virgül/boşluk varsa) isim kabul et
        if (linkTxtClean && /[,\s]/.test(linkTxtClean) && linkTxtClean.toLowerCase() !== login) {
            pName = linkTxtClean;
        }
        if (!pName) {
            const c2 = (cells[2]?.textContent || '').trim();
            if (c2 && c2.toLowerCase() !== login && /[a-zA-Z]/.test(c2)) pName = c2;
        }

        return {
            login,
            name:      pName,
            location:  cells[5]?.textContent.trim()||'',
            pickArea:  cells[4]?.textContent.trim()||'',
            batchId:   cells[6]?.querySelector('a')?.textContent.trim()||'',
            status:    cells[8]?.textContent.trim()||'',
            cptTime,
            cptTs,
            path:      (cells[3]?.querySelector('a')||cells[3])?.textContent.trim()||'',
            lastContainer: cells[10]?.textContent.trim()||''
        };
    }

    // Ekrandaki satırları oku
    function pushWorkforce() {
        const rows = document.querySelectorAll('tr.awsui-table-row');
        if(!rows.length) return;
        const now = Date.now();
        const wfData={}, cptGroups={}, seen=new Set();
        let omniscanSkipped = 0;

        rows.forEach(row => {
            const r = parseRow(row.querySelectorAll('td'), now);
            if(!r || seen.has(r.login)) return;
            seen.add(r.login);
            // v10.45: Şu path'lerdeki picker'ları tamamen atla:
            // PPOmniscan, PPCFP, PPConsolidationFlow*, PPCubiscan, PPQA
            // (CPT Manager pick operasyonuna odaklı — bu path'ler ayrı akış)
            if (r.path && /omniscan|cfp|consolidationflow|cubiscan|^ppqa$|\bppqa\b/i.test(r.path)) {
                omniscanSkipped++;
                return;
            }
            wfData[r.login] = r;
            if(!r.cptTs) return;
            const k = String(r.cptTs);
            if(!cptGroups[k]) {
                const d=new Date(r.cptTs);
                cptGroups[k]={ label:`${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${tsToHHMM(r.cptTs)}`, ts:r.cptTs, pickers:[] };
            }
            cptGroups[k].pickers.push({ login:r.login, batchId:r.batchId, path:r.path });
        });

        if (omniscanSkipped > 0) {
            dlog(`🚫 ${omniscanSkipped} Omniscan picker atlandı`);
        }

        if(!Object.keys(wfData).length) {
            // v10.23: Boş cevap geldiğinde cache'e DOKUNMA.
            // Eski dolu veri saklanmaya devam eder — kullanıcı asla "veri yok" görmez.
            return;
        }
        // Dolu cevap geldi → lastGoodTs güncelle
        _lastGoodPushWf = Date.now();

        // ÖNCEKİ CPT KORUNMASI KALDIRILDI:
        // Eskiden "şu an CPT yoksa ama eskiden vardı → eski CPT'yi koru" mantığı vardı.
        // Bu YANLIŞ: picker batch'i bitirdi/iptal etti, ŞİMDİ işsiz — eski CPT'yi
        // yazmamalıyız. parseRow zaten link text'inde parantez içi saat YOKSA
        // cptTime=''  döndürür, bu durumda picker doğru şekilde "işsiz" sayılır.
        // (inScanner API ayrıca aktif olanlara CPT yazıyor, oradan güncelleniyor.)

        push('cpt_workforce_v9', { data:wfData, ts:now });

        if(Object.keys(cptGroups).length) {
            const sorted = Object.fromEntries(Object.entries(cptGroups).sort((a,b)=>+a[0]-+b[0]));
            const obj = { data:sorted, ts:now };
            push('cpt_scanner_v9', obj);
            try { GM_setValue('cpt_wf_scanner_v9', obj); } catch(e) {}
        }
    }

    // inScanner API — kesin CPT saatleri
    async function fetchInScanner() {
        const r = await gmFetch(`https://picking-console.eu.picking.aft.a2z.com/api/fcs/${FC_ID}/process-paths/inScanner`, {json:true});
        if(!r) return;
        try {
            const list = JSON.parse(r.responseText).inScannerPickList || [];
            const pickerCpt = {};
            let omniSkip = 0;
            list.forEach(item => {
                const login = (item.pickerLogin||'').toLowerCase();
                if(!login) return;
                // v10.45: Omniscan/CFP/Cubiscan/QA picker'ları atla
                const pp = String(item.processPath || item.processPathName || '');
                if (pp && /omniscan|cfp|consolidationflow|cubiscan|^ppqa$|\bppqa\b/i.test(pp)) { omniSkip++; return; }
                const ts = (item.expectedShipmentDate||0)*1000;
                if(!ts) return;
                if(!pickerCpt[login] || ts < pickerCpt[login].cptTs)
                    pickerCpt[login] = { cptTime:tsToHHMM(ts), cptTs:ts };
            });
            if (omniSkip > 0) dlog(`🚫 inScanner API: ${omniSkip} Omniscan picker atlandı`);
            if(!Object.keys(pickerCpt).length) return;

            const wf = read('cpt_workforce_v9');
            if(wf?.data) {
                let changed=false;
                Object.entries(pickerCpt).forEach(([l,{cptTime,cptTs}]) => {
                    if(wf.data[l]) { wf.data[l].cptTime=cptTime; wf.data[l].cptTs=cptTs; changed=true; }
                });
                if(changed) push('cpt_workforce_v9', wf);
            }
            const cptData={};
            Object.entries(pickerCpt).forEach(([l,{cptTime}]) => { cptData[l]=cptTime; });
            push('cpt_scanner_cpt_v9', { data:cptData, ts:Date.now() });
        } catch(e) {}
    }

    // Tüm workforce sayfaları (sayfalama bypass)
    async function fetchWorkforcePages(token, acc) {
        acc = acc || {};
        const url = `${PC}/pick-workforce` + (token ? `?pageToken=${encodeURIComponent(token)}` : '');
        const r = await gmFetch(url);
        if(!r) return;

        const doc = parseHTML(r.responseText);
        const now = Date.now();
        doc.querySelectorAll('tr.awsui-table-row').forEach(row => {
            const parsed = parseRow(row.querySelectorAll('td'), now);
            if (!parsed || acc[parsed.login]) return;
            // v10.45: Omniscan/CFP/Cubiscan/QA path filtrele
            if (parsed.path && /omniscan|cfp|consolidationflow|cubiscan|^ppqa$|\bppqa\b/i.test(parsed.path)) return;
            acc[parsed.login] = parsed;
        });

        // Sonraki sayfa?
        const nxt = doc.querySelector('a[aria-label*="next" i]');
        const tkm = (nxt?.getAttribute('href')||'').match(/pageToken=([^&]+)/);
        if(tkm && Object.keys(acc).length < 1000) {
            await new Promise(r=>setTimeout(r,600));
            return fetchWorkforcePages(decodeURIComponent(tkm[1]), acc);
        }

        if(!Object.keys(acc).length) {
            // v10.23: Boş cevap → cache'e DOKUNMA, eski dolu veri korunur
            return;
        }
        // Dolu cevap → lastGoodTs güncelle
        _lastGoodFetchWf = Date.now();
        // Önceki CPT korunması KALDIRILDI — parseRow doğru şekilde işsizleri boş döndürür
        push('cpt_workforce_v9', { data:acc, ts:Date.now() });
    }

    // Pick Areas C4 — tüm sayfaları çek, her satırdan processPath al
    async function fetchPickAreas(nextUrl, acc, pathSet, activePickers) {
        const isFirst = !acc;
        const url = nextUrl || `${PC}/pick-areas-c4`;
        acc = acc || {};
        pathSet = pathSet || new Set();
        activePickers = activePickers || 0;

        // v11.28: ÖNCE JSON API'yi dene. Bu sabit URL'dir, parametre yok.
        // Pick Areas sayfası HİÇ AÇILMADAN da çalışır (workforce sekmesinden direkt fetch).
        // Sadece ilk sayfada (sayfalama yoksa JSON tek seferde gelir) dene.
        // v11.29: PC_API (ham domain) kullan + cevap parse'ı areaDetailsSnapshot.areaDetailsList için
        if (isFirst) {
            try {
                const apiUrl = `${PC_API}/api/fcs/${FC_ID}/area-details-snapshot`;
                const jr = await gmFetch(apiUrl, {json: true, timeout: 15000});
                if (jr && jr.responseText && (jr.responseText.trim()[0] === '{' || jr.responseText.trim()[0] === '[')) {
                    const data = JSON.parse(jr.responseText);
                    // v11.29: Gerçek cevap formatı:
                    //   { areaDetailsSnapshot: { areaDetailsList: [...] } }
                    // Önce bu net path'i dene, sonra eski fallback'lere düş.
                    let items = null;
                    if (data.areaDetailsSnapshot && Array.isArray(data.areaDetailsSnapshot.areaDetailsList)) {
                        items = data.areaDetailsSnapshot.areaDetailsList;
                    } else if (Array.isArray(data)) items = data;
                    else if (Array.isArray(data.items)) items = data.items;
                    else if (Array.isArray(data.areas)) items = data.areas;
                    else if (Array.isArray(data.areaDetailsList)) items = data.areaDetailsList;
                    else if (Array.isArray(data.pickAreas)) items = data.pickAreas;
                    else if (Array.isArray(data.data)) items = data.data;
                    else if (Array.isArray(data.results)) items = data.results;
                    else {
                        // Nested? İlk uygun array'i bul
                        for (const k of Object.keys(data)) {
                            if (Array.isArray(data[k]) && data[k].length > 0
                                && typeof data[k][0] === 'object'
                                && (data[k][0].pickArea || data[k][0].area || data[k][0].processPath || data[k][0].totalUnits || data[k][0].batchId)) {
                                items = data[k]; break;
                            }
                        }
                    }
                    if (items && items.length) {
                        const jsAcc = {};
                        const jsPaths = new Set();
                        items.forEach(it => {
                            // v11.29: Gerçek field isimleri (response'tan):
                            //   batchId, destination, processPath, nonPrioritizedUnitCounts, prioritizedUnitCounts, pickerCount, pickArea
                            // v11.30 FIX: area = pickArea (fiziksel kat: "pa3X", "pa5A02"), destination DEĞİL.
                            //   HTML kat regex'i /^pa(\d)/ pickArea'ya uyar; destination ("pkREBINM001") UYMAZ.
                            const area = String(it.pickArea || it.area || it.areaId || it.areaName || it.destination || '').toLowerCase().trim();
                            if (!area) return;
                            // ProcessPath — string veya {name, id} obje olabilir
                            let pp = '';
                            const ppRaw = it.processPath || it.processPathName || it.path || '';
                            if (typeof ppRaw === 'string') pp = ppRaw;
                            else if (ppRaw && typeof ppRaw === 'object') pp = ppRaw.name || ppRaw.id || ppRaw.processPath || '';
                            pp = String(pp).trim();
                            // PP prefix garantisi
                            if (pp && !pp.startsWith('PP') && !pp.startsWith('all')) pp = 'PP' + pp;
                            if (pp.startsWith('PP')) jsPaths.add(pp);

                            const batchRaw = it.batchId || it.batch || it.pickBatchId || '';
                            const batchId = String(typeof batchRaw === 'object' ? (batchRaw.id || '') : batchRaw).trim() || '0';

                            // v11.29: Total units = nonPrioritized + prioritized toplamı
                            //   nonPrioritizedUnitCounts: {fastTrack, minPriority, premium, sameNext, standard, superSavers}
                            //   prioritizedUnitCounts: aynı yapı
                            function _sumCounts(obj) {
                                if (!obj || typeof obj !== 'object') return 0;
                                let s = 0;
                                for (const k of Object.keys(obj)) {
                                    const v = parseInt(obj[k]); if (!isNaN(v)) s += v;
                                }
                                return s;
                            }
                            const npTotal = _sumCounts(it.nonPrioritizedUnitCounts);
                            const pTotal  = _sumCounts(it.prioritizedUnitCounts);
                            let tu = npTotal + pTotal;
                            // Fallback: düz field'lar
                            if (!tu) tu = parseInt(it.totalUnits || it.totalUnit || it.units || it.remaining || it.unitsRemaining || 0) || 0;
                            const pk = parseInt(it.pickerCount || it.pickers || it.activePickers || 0) || 0;

                            if (tu > 0) {
                                // v11.30 FIX: Aynı (area, pp, batchId) key birden fazla item'da çıkarsa
                                //   ÜZERİNE YAZMA, topla. Aksi halde ürünler kaybolur.
                                const key = `${area}|${pp || 'all'}|${batchId}`;
                                if (jsAcc[key]) {
                                    jsAcc[key].remaining += tu;
                                    if (pk > jsAcc[key].pickers) jsAcc[key].pickers = pk;
                                } else {
                                    jsAcc[key] = { area, remaining: tu, picked: 0, pickers: pk, processPath: pp || 'all' };
                                }
                            }
                        });
                        if (Object.keys(jsAcc).length) {
                            // ActivePickers — JSON'da varsa al
                            let activeP = parseInt(data.activePickers || data.totalActivePickers ||
                                                   (data.areaDetailsSnapshot && data.areaDetailsSnapshot.activePickers) || 0) || 0;
                            // Önceki allPaths ile merge
                            try { (read('cpt_pick_areas_v9')?.allPaths || []).forEach(p => jsPaths.add(p)); } catch (e) {}
                            const allPaths = [...jsPaths].sort();
                            const pathTotals = {};
                            Object.values(jsAcc).forEach(d => {
                                if (d.processPath && d.processPath !== 'all')
                                    pathTotals[d.processPath] = (pathTotals[d.processPath] || 0) + (d.remaining || 0);
                            });
                            _lastGoodAreas = Date.now();
                            push('cpt_pick_areas_v9', { data: jsAcc, selectedPaths: allPaths, allPaths, activePickers: activeP, pathTotals, ts: Date.now() });
                            console.log(`[CPT11.30 areas] ✅ JSON API: ${Object.keys(jsAcc).length} rows, ${allPaths.length} paths, activePickers=${activeP}`);
                            return;  // Başarılı — HTML scrape'e gerek yok
                        } else {
                            console.log('[CPT11.29 areas] JSON parse OK ama tu>0 olan kayıt yok — HTML fallback');
                        }
                    } else {
                        console.log('[CPT11.29 areas] JSON cevabında array bulunamadı, kök tipi:', typeof data, 'keys:', Object.keys(data || {}).slice(0, 10).join(','));
                    }
                } else {
                    console.log('[CPT11.29 areas] JSON fetch boş veya non-JSON, HTML fallback. Status:', jr?.status, 'Len:', jr?.responseText?.length);
                }
            } catch (e) {
                console.log('[CPT11.29 areas] JSON API hatası, HTML fallback:', e.message);
            }
        }

        // ─── FALLBACK: HTML scrape (eski yöntem) ───
        const r = await gmFetch(url, {timeout:15000});
        if(!r) return;
        const doc = parseHTML(r.responseText);

        // Active pickers (sadece ilk sayfada)
        if(isFirst) {
            doc.querySelectorAll('*').forEach(el => {
                if(el.children.length===0 && el.textContent.trim()==='Active Pickers') {
                    const sib = el.nextElementSibling || el.parentElement?.nextElementSibling;
                    const v = parseInt((sib?.textContent||'').replace(/,/g,''));
                    if(v>0) activePickers = v;
                }
            });
        }

        // Header index
        const ths = [...doc.querySelectorAll('table thead th')];
        let tuIdx=5, pkIdx=6;
        ths.forEach((th,i) => {
            const t = th.textContent.trim().toLowerCase();
            if(t==='total units') tuIdx=i;
            else if(t==='pickers') pkIdx=i;
        });

        // Tablo satırlarını parse et
        doc.querySelectorAll('table tbody tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            if(cells.length < 4) return;
            const area = cells[0].textContent.trim().toLowerCase();
            if(!area || area==='pick area') return;

            // processPath — önce href'den al
            let pp = '';
            const pathLink = cells[1]?.querySelector('a');
            if(pathLink) {
                const hm = (pathLink.getAttribute('href')||'').match(/\/process-path\/(PP\w+)/);
                pp = hm ? hm[1] : pathLink.textContent.trim();
            }
            if(!pp || pp==='all') {
                // href yoksa cells[1] text
                const txt = cells[1]?.textContent.trim();
                if(txt && txt.startsWith('PP')) pp = txt;
            }

            if(pp && pp.startsWith('PP')) pathSet.add(pp);

            const batchLink = cells[2]?.querySelector('a');
            const batchId = batchLink?.textContent.trim() || '0';
            const tu = parseInt((cells[tuIdx]?.textContent||'').replace(/\D/g,'')) || 0;
            const pk = parseInt((cells[pkIdx]?.textContent||'').replace(/\D/g,'')) || 0;

            if(tu > 0) {
                const key = `${area}|${pp||'all'}|${batchId}`;
                acc[key] = {area, remaining:tu, picked:0, pickers:pk, processPath:pp||'all'};
            }
        });

        // Sonraki sayfa var mı?
        const nxt = doc.querySelector('a[aria-label*="next" i], button[aria-label*="next page" i]:not([disabled])');
        const tkm = (nxt?.getAttribute('href')||'').match(/pageToken=([^&]+)/);
        if(tkm && Object.keys(acc).length < 5000) {
            const nu = `https://picking-console.eu.picking.aft.a2z.com${nxt.getAttribute('href')}`;
            await new Promise(res=>setTimeout(res,500));
            return fetchPickAreas(nu, acc, pathSet, activePickers);
        }

        // Önceki allPaths ile merge
        try { (read('cpt_pick_areas_v9')?.allPaths||[]).forEach(p=>pathSet.add(p)); } catch(e){}
        const allPaths = [...pathSet].sort();

        // pathTotals hesapla
        const pathTotals = {};
        Object.values(acc).forEach(d => {
            if(d.processPath && d.processPath !== 'all')
                pathTotals[d.processPath] = (pathTotals[d.processPath]||0) + (d.remaining||0);
        });

        if(!Object.keys(acc).length) {
            // v10.23: Boş cevap → cache'e DOKUNMA, eski dolu veri korunur
            return;
        }
        // Dolu cevap → lastGoodTs güncelle
        _lastGoodAreas = Date.now();
        push('cpt_pick_areas_v9', {data:acc, selectedPaths:allPaths, allPaths, activePickers, pathTotals, ts:Date.now()});
        console.log(`[CPT10 areas] ${Object.keys(acc).length} rows, ${allPaths.length} paths`, pathTotals);
    }

    // v10.23: fetchPickBatches KALDIRILDI — rate hesabı artık cpt_picker_counts_v9 üzerinden

    // In Scanner (HTML)
    async function fetchInScannerPage() {
        const r = await gmFetch(`${PC}/all-in-scanner`);
        if(!r) return;
        const doc = parseHTML(r.responseText);
        const counts={}, cpts={};
        doc.querySelectorAll('tr.awsui-table-row').forEach(row => {
            const cells=row.querySelectorAll('td'); if(cells.length<2) return;
            const lnk=cells[1]?.querySelector('a'); if(!lnk) return;
            const m=(lnk.getAttribute('href')||'').match(/\/picker\/([^/?]+)/); if(!m) return;
            const login=m[1].toLowerCase();
            row.querySelectorAll('time[datetime]').forEach(t=>{
                const dt=t.getAttribute('datetime');
                if(dt&&/^\d+$/.test(dt)&&!cpts[login]) cpts[login]=tsToHHMM(parseInt(dt));
            });
            for(let i=2;i<Math.min(cells.length,7);i++){const v=parseInt(cells[i].textContent);if(v>0){counts[login]=v;break;}}
        });
        if(Object.keys(cpts).length)   push('cpt_scanner_cpt_v9',{data:cpts,ts:Date.now()});
        if(Object.keys(counts).length)  push('cpt_picker_counts_v9',{data:counts,ts:Date.now()});
    }

    // Current Scorecard — sadece scorecard sayfası kapalıysa arka planda çek
    async function fetchScorecard() {
        const t = new Date();
        const today = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;

        // v11.28: Yeni API pattern (epoch saniye, path-based):
        //   /api/fcs/{FC}/reports/current-scorecard/from/{epochSec}/to/{epochSec}
        // Bu pattern Scorecard sayfası HİÇ AÇILMADAN da çalışır — URL elle inşa edilir.
        // from = bugün 00:00 yerel, to = şu an (vardiya hâlâ devam ediyor olabilir).
        // v11.29: PC_API (ham domain) kullan — PC içindeki /fc/IST2/ prefix'i API çağrılarında YANLIŞ.
        function _buildScorecardUrl() {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const fromEpoch = Math.floor(start.getTime() / 1000);
            const toEpoch   = Math.floor(now.getTime() / 1000);
            return `${PC_API}/api/fcs/${FC_ID}/reports/current-scorecard/from/${fromEpoch}/to/${toEpoch}`;
        }

        // ─── ÖNCE: API URL kayıtlı mı? — Scorecard sayfası açıldıysa interceptor URL'i kaydetmiş olur
        // O zaman direkt JSON API'yi kullan, çok daha hızlı (ms cinsinden) ve %100 doğru
        let apiInfo = null;
        try { apiInfo = GM_getValue('cpt_scorecard_api_url', null); } catch(e) {}

        // v11.28: URL yoksa OTOMATİK inşa et (epoch-pattern). Artık Scorecard sayfası açmaya gerek yok.
        if (!apiInfo || !apiInfo.url) {
            const builtUrl = _buildScorecardUrl();
            apiInfo = { url: builtUrl, ts: Date.now(), synthetic: true };
            dlog('🔧 Scorecard URL otomatik inşa edildi: ' + builtUrl.substring(0, 100));
        }
        if (apiInfo && apiInfo.url && (Date.now() - apiInfo.ts) < 30 * 24 * 3600 * 1000) {
            try {
                // v11.28: URL pattern'ine göre güncelle.
                // Yeni pattern (epoch path-based): /from/{epochSec}/to/{epochSec}
                // Eski pattern (query-based):   ?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD&fromTime=HH:MM&toTime=HH:MM
                let apiUrl = apiInfo.url;
                if (/\/from\/\d+\/to\/\d+/.test(apiUrl)) {
                    // Epoch-pattern URL — bugüne göre yenile
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                    const fromEpoch = Math.floor(start.getTime() / 1000);
                    const toEpoch   = Math.floor(now.getTime() / 1000);
                    apiUrl = apiUrl.replace(/\/from\/\d+\/to\/\d+/, `/from/${fromEpoch}/to/${toEpoch}`);
                } else {
                    // Eski query-pattern URL — date/time parametrelerini bugüne göre güncelle
                    apiUrl = apiUrl
                        .replace(/fromDate=[^&]*/, `fromDate=${today}`)
                        .replace(/toDate=[^&]*/, `toDate=${today}`)
                        .replace(/fromTime=[^&]*/, 'fromTime=00:00')
                        .replace(/toTime=[^&]*/, 'toTime=23:59');
                    // pageSize yoksa ekle
                    if (!apiUrl.includes('pageSize')) apiUrl += '&pageSize=500';
                }
                console.log('[CPT11.31 bg-scorecard] POST fetching:', apiUrl.substring(0, 120));
                // v11.31: POST gerekiyor (GET → 404 "No method found").
                // Body: {"pickProcessList":["All"]} — tüm process path'leri kapsar.
                const r = await gmFetch(apiUrl, {json: true, method: 'POST', body: '{"pickProcessList":["All"]}', timeout: 15000});
                if (r && r.responseText && r.responseText.trim()[0] === '{') {
                    const data = JSON.parse(r.responseText);
                    let items = null;
                    // v11.31: Gerçek cevap formatı (Network'ten tespit edildi):
                    //   { activeScorecardData: { fullCurrentScorecardData: {...obj}, fullCurrentScorecardDataVector: [...394 picker] } }
                    // Picker listesi "Vector" eki olan ARRAY field'ında.
                    if (data.activeScorecardData && Array.isArray(data.activeScorecardData.fullCurrentScorecardDataVector)) {
                        items = data.activeScorecardData.fullCurrentScorecardDataVector;
                    } else if (data.activeScorecardData && Array.isArray(data.activeScorecardData.fullCurrentScorecardData)) {
                        items = data.activeScorecardData.fullCurrentScorecardData;
                    } else if (Array.isArray(data)) items = data;
                    else if (Array.isArray(data.items)) items = data.items;
                    else if (Array.isArray(data.scorecards)) items = data.scorecards;
                    else if (Array.isArray(data.results)) items = data.results;
                    else if (Array.isArray(data.data)) items = data.data;
                    else {
                        // Esnek arama: login/employeeId barındıran ilk array
                        const _walk = (obj, depth) => {
                            if (!obj || depth > 4) return null;
                            for (const k of Object.keys(obj)) {
                                const v = obj[k];
                                if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object'
                                    && (v[0].login || v[0].userId || v[0].employeeId)) return v;
                                if (v && typeof v === 'object' && !Array.isArray(v)) {
                                    const found = _walk(v, depth+1);
                                    if (found) return found;
                                }
                            }
                            return null;
                        };
                        items = _walk(data, 0);
                    }
                    if (items && items.length) {
                        const parsed = {};
                        items.forEach(item => {
                            // v11.31: Gerçek picker tanımlayıcı `login` (lowercase, ör. "yakuyili")
                            const login = String(item.login || item.userId || item.user_id || item.employeeId || '').toLowerCase().trim();
                            if (!login || login.length < 3) return;
                            // v11.31: Gerçek field'lar:
                            //   quantityPicked (picks)
                            //   actualDirectTime / expectedDirectTime — SAAT cinsinden (örn. 0.789 = 47dk)
                            //   perDirectTime — oran (1.0 = %100, 1.26 = %126)
                            //   directPickRate (DPR, ünit/saat)
                            //   expectedPickRate (Expected PR)
                            //   pickProcess / processPath / pickRegion bilgileri null gelebilir
                            // Saat → "HH:MM:SS" string formatına dönüştür (HTML eski beklenti)
                            const _hToStr = h => {
                                const n = parseFloat(h);
                                if (isNaN(n) || n <= 0) return '';
                                const tot = Math.round(n * 3600);
                                const hh = Math.floor(tot / 3600);
                                const mm = Math.floor((tot % 3600) / 60);
                                const ss = tot % 60;
                                return String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0') + ':' + String(ss).padStart(2,'0');
                            };
                            const actDTHours = item.actualDirectTime || item.actualTime || 0;
                            const expDTHours = item.expectedDirectTime || item.expectedTime || 0;
                            const perDT = parseFloat(item.perDirectTime || item.percentToDirectTime || 0) || 0;
                            // perDirectTime 1.26 (oran) → %126 olarak yaz (HTML eski beklenti yüzde)
                            const pctDT = perDT > 5 ? perDT : Math.round(perDT * 100);
                            parsed[login] = {
                                login,
                                picks:  parseInt(item.quantityPicked || item.picks || 0) || 0,
                                actDT:  _hToStr(actDTHours),
                                expDT:  _hToStr(expDTHours),
                                pctDT:  pctDT,
                                dpr:    parseInt(item.directPickRate || item.pickRate || 0) || 0,
                                expPR:  parseInt(item.expectedPickRate || 0) || 0,
                                ts:     Date.now()
                            };
                        });
                        if (Object.keys(parsed).length) {
                            push('cpt_scorecard_v9', { data: parsed, ts: Date.now() });
                            console.log('[CPT11.31 bg-scorecard] ✅ POST API: pushed', Object.keys(parsed).length, 'pickers');
                            return;
                        } else {
                            console.log('[CPT11.31 bg-scorecard] items var (' + items.length + ') ama login yok — HTML fallback');
                        }
                    } else {
                        console.log('[CPT11.31 bg-scorecard] cevap formatında array bulunamadı, keys:', Object.keys(data).slice(0,8).join(','));
                    }
                } else {
                    console.log('[CPT11.31 bg-scorecard] POST cevabı boş/non-JSON. Status:', r?.status, 'Len:', r?.responseText?.length);
                }
            } catch(e) {
                console.log('[CPT10 bg-scorecard] API failed, falling back:', e.message);
            }
        }

        // FALLBACK: HTML scrape (SPA boş döner ama yine de deneyelim)
        const r = await gmFetch(`${PC}/reports/current-scorecard?fromDate=${today}&toDate=${today}&pageSize=500`);
        if(!r) return;
        const doc = parseHTML(r.responseText);
        const headers=[...doc.querySelectorAll('thead th[data-awsui-column-id]')].map(th=>th.getAttribute('data-awsui-column-id'));
        const idx=n=>headers.indexOf(n);
        const data={};
        doc.querySelectorAll('tbody tr.awsui-table-row').forEach(row => {
            const cells=row.querySelectorAll('td'); if(cells.length<6) return;
            const lCell=idx('login')>=0?cells[idx('login')]:cells[0];
            const lm=(lCell?.querySelector('a')?.getAttribute('href')||'').match(/\/picker\/([^/?]+)/);
            const login=(lm?lm[1]:lCell?.querySelector('a')?.textContent.trim())?.toLowerCase()||'';
            if(!login||login.length<3) return;
            const g=(i,fb)=>(i>=0?cells[i]:cells[fb])?.textContent.trim()||'';
            // Birden fazla olası column ID dene
            const actDTVal = g(idx('actualDirectTime'),3)||g(idx('actualTime'),3)||g(idx('directTime'),3)||'';
            const expDTVal = g(idx('expectedDirectTime'),4)||g(idx('expectedTime'),4)||'';
            const pctVal   = parseFloat(g(idx('perDirectTime'),5)||g(idx('percentToDirectTime'),5)||'0')||0;
            const dprVal   = parseInt(g(idx('directPickRate'),6)||g(idx('pickRate'),6)||'0')||0;
            data[login]={
                picks:  parseInt(g(idx('quantityPicked'),2).replace(/,/g,''))||0,
                actDT:  actDTVal,
                expDT:  expDTVal,
                pctDT:  pctVal,
                dpr:    dprVal,
                expPR:  parseInt(g(idx('expectedPickRate'),7))||0,
                ts:     Date.now()
            };
        });
        if(Object.keys(data).length) {
            push('cpt_scorecard_v9',{data,ts:Date.now()});
            console.log('[CPT10 bg-scorecard] HTML scrape: pushed', Object.keys(data).length, 'pickers');
        }
    }


    // Rodeo: Transit — ExSD özetinden CPT totalleri + ItemList'ten batch detayları
    // CPT timestamp → HH:MM (gece geçişi sayfasındaki gibi)
    function tsToCptHHMM(ts) {
        if(!ts) return '';
        const d = new Date(ts);
        // Saat:dk - sayfa zaten yerel zamanı veriyor
        return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
    }

    // ExSD sayfasından CPT bazlı total transit sayısı
    async function fetchTransitTotals() {
        const r = await gmFetch(`${RODEO}/ExSD`, {timeout:12000, debug:true});
        if(!r) return null;
        const doc = parseHTML(r.responseText);

        // Satır: TotalPickingPickedInTransitId
        const row = doc.getElementById('TotalPickingPickedInTransitId');
        if(!row) {
            console.log('[CPT10 transit] ExSD row not found');
            return null;
        }

        // Her <a> içindeki href'ten RangeStartMillis/RangeEndMillis ve sayıyı oku
        // İlk subtotal'ı atla (toplam) - dakika aralıkları (60sn'lik) gerçek CPT'ler
        const cptTotals = {};   // 'HH:MM' -> count
        const cptTs     = {};   // 'HH:MM' -> ts

        row.querySelectorAll('td a[href*="ExSDRange.RangeStartMillis"]').forEach(a => {
            const href = a.getAttribute('href') || '';
            const sm = href.match(/RangeStartMillis=(\d+)/);
            const em = href.match(/RangeEndMillis=(\d+)/);
            if(!sm || !em) return;
            const startTs = parseInt(sm[1]);
            const endTs   = parseInt(em[1]);
            const span    = endTs - startTs;
            // Genel subtotal: span > 1 saat — atla (sadece dakika aralığı = CPT)
            if(span > 3600000) return;
            const count = parseInt(a.textContent.trim().replace(/,/g,'')) || 0;
            if(!count) return;
            // Aralığın ortası = CPT timestamp
            const midTs = Math.round((startTs + endTs) / 2 / 60000) * 60000;
            const hhmm  = tsToCptHHMM(midTs);
            cptTotals[hhmm] = (cptTotals[hhmm] || 0) + count;
            if(!cptTs[hhmm]) cptTs[hhmm] = midTs;
        });

        const grandTotal = Object.values(cptTotals).reduce((s,v)=>s+v, 0);
        console.log('[CPT10 transit-totals]', Object.keys(cptTotals).length, 'CPT,', grandTotal, 'item');
        return { cptTotals, cptTs, grandTotal };
    }

    // dlog burada local olarak tanımlı DEĞİL — IIFE başındaki global dlog'u kullanıyoruz
    // (her sayfada aynı GM storage anahtarına yazar, [HOST] prefix'iyle)

    // ItemList'ten TOTE detayları (Scannable ID bazında) + Expected Ship Date'den CPT
    async function fetchTransit() {
        // v12.08: ESKİ SİSTEM — DEVRE DIŞI. Bu fonksiyon eski cross-origin fetch mantığı
        //   (gmFetch/fetchTransitTotals) kullanıyor ve totes={} ile listeyi SİLEBİLİYOR.
        //   Yeni sistem runTransitFetch() (Rodeo ExSD bloğunda, satır ~6212) tüm korumalarla
        //   çalışıyor. Bu eski fonksiyon yanlışlıkla (GM menüsü vs.) çağrılsa bile ARTIK
        //   HİÇBİR ŞEY YAPMASIN — listeyi bozmasın.
        dlog('⛔ ESKİ fetchTransit() çağrıldı ama DEVRE DIŞI (yeni sistem runTransitFetch kullanılıyor)');
        return;
        // eslint-disable-next-line no-unreachable
        const now = Date.now();
        dlog('═══ fetchTransit BAŞLADI ═══');

        // ItemList URL — size=2000 ile tüm sayfayı al, dwell + scannable + qty default geliyor
        const listUrl = `${RODEO}/ItemList?_enabledColumns=on&WorkPool=PickingPickedInTransit&FulfillmentServiceClass=FASTTRACK&enabledColumns=DEMAND_ID&enabledColumns=PROMISE_DATE&enabledColumns=PICK_BATCH_ID&enabledColumns=PROCESS_PATH&ExSDRange.RangeStartMillis=${now-86400000}&ExSDRange.RangeEndMillis=${now+3*86400000}&shipmentType=CUSTOMER_SHIPMENTS&size=2000`;
        dlog('ItemList URL hazır:', listUrl.substring(0, 120) + '...');

        // Paralel: özet + detay (debug açık)
        const [totalsResp, listResp] = await Promise.all([
            fetchTransitTotals(),
            gmFetch(listUrl, {timeout:20000, debug:true})
        ]);

        if(!listResp) {
            dlog('❌ ItemList fetch BAŞARISIZ (response null)');
            if(totalsResp) {
                push('cpt_transit_batches_v9', {
                    totes: {},
                    cptTotals: totalsResp.cptTotals,
                    cptTs: totalsResp.cptTs,
                    grandTotal: totalsResp.grandTotal,
                    ts: Date.now()
                });
            }
            return;
        }
        dlog('✓ ItemList response geldi, length:', (listResp.responseText||'').length);

        const doc = parseHTML(listResp.responseText);

        // Detaylı response inspection
        const respLen = (listResp.responseText || '').length;
        const allTables = doc.querySelectorAll('table');
        const allTheads = doc.querySelectorAll('thead');
        const allTbodyTrs = doc.querySelectorAll('tbody tr');
        dlog('Tablo analizi → len:', respLen, '| tables:', allTables.length, '| theads:', allTheads.length, '| tbody trs:', allTbodyTrs.length);

        // Tablo başlıklarını oku — data-column attribute'u öncelik (daha güvenilir)
        const ths = [...doc.querySelectorAll('table thead th')];
        if(!ths.length) {
            dlog('❌ THEAD bulunamadı! Length:', respLen);
            // Response'un ilk 500 karakterini göster
            dlog('Response head:', (listResp.responseText || '').substring(0, 500));
            // "login" / "auth" / "midway" kelimesi var mı?
            const lower = (listResp.responseText || '').toLowerCase();
            if(lower.includes('midway') || lower.includes('login') || lower.includes('authentication')) {
                dlog('⚠️ Login/Midway redirect tespit edildi!');
            }
            push('cpt_transit_batches_v9', {
                totes: {},
                cptTotals: totalsResp?.cptTotals || {},
                cptTs:     totalsResp?.cptTs     || {},
                grandTotal: totalsResp?.grandTotal || 0,
                ts: Date.now()
            });
            return;
        }

        // Header isimlerini al
        const headerNames = ths.map(th => (th.textContent || '').trim().toLowerCase().replace(/\s+/g,' '));
        dlog('Headers:', JSON.stringify(headerNames));

        // data-column → header text map (sırayla atanmış olabilir)
        const findCol = (...names) => {
            for(const n of names) {
                const ln = n.toLowerCase();
                // Tam eşleşme önce
                let i = headerNames.findIndex(h => h === ln);
                if(i >= 0) return i;
                // Sonra includes
                i = headerNames.findIndex(h => h.includes(ln));
                if(i >= 0) return i;
            }
            return -1;
        };

        const colExSD   = findCol('expected ship date','expected ship','exsd','promise date');
        const colScan   = findCol('scannable id');
        const colOuter  = findCol('outer scannable id','outer scannable');
        const colQty    = findCol('quantity');
        const colDwell  = findCol('dwell time','dwell');

        console.log('[CPT10 transit] cols → ExSD:', colExSD, 'Scan:', colScan, 'Qty:', colQty, 'Dwell:', colDwell);

        // CPT formatı: "2026-05-20 13:30" → "13:30"
        const parseCptCell = txt => {
            if(!txt) return { cpt:'', cptTs:null };
            const m = txt.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
            if(m) {
                const d = new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5]);
                return { cpt: m[4]+':'+m[5], cptTs: d.getTime() };
            }
            const m2 = txt.match(/(\d{2}):(\d{2})/);
            return m2 ? { cpt: m2[0], cptTs: null } : { cpt:'', cptTs:null };
        };

        // Dwell "23m" / "1h 5m" / "2d 3h" → dakika
        const parseDwellMinutes = txt => {
            if(!txt) return 0;
            let mins = 0;
            const d = txt.match(/(\d+)\s*d/i);  if(d) mins += parseInt(d[1])*1440;
            const h = txt.match(/(\d+)\s*h/i);  if(h) mins += parseInt(h[1])*60;
            const m = txt.match(/(\d+)\s*m(?!s)/i); if(m) mins += parseInt(m[1]);
            if(!mins) {
                const only = txt.match(/^(\d+)$/);
                if(only) mins = parseInt(only[1]);
            }
            return mins;
        };

        // Tote bazında grupla
        const totes = {};

        const rows = doc.querySelectorAll('table tbody tr');
        console.log('[CPT10 transit] body rows:', rows.length);

        // İlk satırın ham HTML'ini logla — kolonları net görelim
        if(rows.length > 0) {
            const firstRowCells = rows[0].querySelectorAll('td');
            console.log('[CPT10 transit] first row cell count:', firstRowCells.length);
            firstRowCells.forEach((td, i) => {
                const txt = (td.textContent || '').trim().substring(0, 80);
                console.log(`  cell[${i}]:`, txt);
            });
        }

        let rowsWithScan = 0;
        let rowsSkipped = 0;

        rows.forEach((row, rowIdx) => {
            const cells = row.querySelectorAll('td');
            if(!cells.length) return;
            const getText = i => i >= 0 && cells[i] ? cells[i].textContent.trim() : '';

            // Scannable ID — bol fallback
            let scannableId = '';

            // Strateji 1: qi-research linkindeki ?s= (HER YERDE arıyoruz, sadece colScan'da değil)
            const allLinks = row.querySelectorAll('a[href*="qi-fcresearch"], a[href*="results?s="]');
            for(const a of allLinks) {
                const href = a.getAttribute('href') || '';
                const m = href.match(/[?&]s=([^&]+)/);
                if(m) {
                    const cand = decodeURIComponent(m[1]).trim();
                    // tsX... ile başlayan tote ID'leri tercih et (FN SKU'lar B07... gibi)
                    if(cand.match(/^ts[A-Za-z0-9]+$/i)) {
                        scannableId = cand;
                        break;
                    }
                }
            }

            // Strateji 2: colScan'daki ilk anchor
            if(!scannableId && colScan >= 0 && cells[colScan]) {
                const a = cells[colScan].querySelector('a');
                if(a) {
                    const t = (a.textContent || '').trim();
                    if(t.match(/^ts[A-Za-z0-9]+$/i)) scannableId = t;
                }
            }

            // Strateji 3: tüm satırın text içeriğinde tsXxxx pattern'i ara
            if(!scannableId) {
                const allText = row.textContent || '';
                const m = allText.match(/\bts[A-Za-z0-9]{8,}\b/);
                if(m) scannableId = m[0];
            }

            if(!scannableId) {
                rowsSkipped++;
                if(rowsSkipped <= 3) {
                    console.warn(`[CPT10 transit] row ${rowIdx} no scannableId. First cell text:`, (cells[0]?.textContent||'').trim().substring(0,100));
                }
                return;
            }
            rowsWithScan++;

            const exsdTxt = getText(colExSD);
            const { cpt, cptTs } = parseCptCell(exsdTxt);

            // Quantity — colQty yoksa "1" varsay
            let qty = 1;
            if(colQty >= 0 && cells[colQty]) {
                const q = parseInt(getText(colQty));
                if(!isNaN(q) && q > 0) qty = q;
            }

            // Dwell — dakikaya çevir
            let dwellMin = 0;
            if(colDwell >= 0 && cells[colDwell]) {
                const dt = cells[colDwell];
                const sp = dt.querySelector('.dwell-time-minutes');
                if(sp) dwellMin = parseInt(sp.textContent.trim()) || 0;
                if(!dwellMin) dwellMin = parseDwellMinutes(dt.textContent || '');
            }
            // Dwell yedek: satırın herhangi bir yerinde .dwell-time-minutes
            if(!dwellMin) {
                const anyD = row.querySelector('.dwell-time-minutes');
                if(anyD) dwellMin = parseInt(anyD.textContent.trim()) || 0;
            }

            if(!totes[scannableId]) {
                totes[scannableId] = {
                    scannableId,
                    cpt,
                    cptTs,
                    totalQty: 0,
                    lineCount: 0,
                    maxDwell: 0,
                    location: '',     // FC Research'ten doldurulur
                    lastPicker: ''    // FC Research'ten doldurulur
                };
            }
            totes[scannableId].totalQty += qty;
            totes[scannableId].lineCount++;
            if(dwellMin > totes[scannableId].maxDwell) totes[scannableId].maxDwell = dwellMin;
            if(!totes[scannableId].cpt && cpt) {
                totes[scannableId].cpt = cpt;
                totes[scannableId].cptTs = cptTs;
            }
        });

        console.log('[CPT10 transit] parsed:', rowsWithScan, '/ skipped:', rowsSkipped, '/ totes:', Object.keys(totes).length);

        // Önce FC Research'siz olarak kaydet (kullanıcı totes'ları görsün)
        const earlyPayload = {
            totes,
            cptTotals: totalsResp?.cptTotals || {},
            cptTs:     totalsResp?.cptTs     || {},
            grandTotal: totalsResp?.grandTotal || 0,
            ts: Date.now(),
            enriching: Object.keys(totes).length > 0
        };
        push('cpt_transit_batches_v9', earlyPayload);

        // FC Research enrich — paralel ama rate-limited
        if(Object.keys(totes).length > 0) {
            await enrichTotesWithFcResearch(totes, totalsResp);
        }
    }

    // FC Research'ten tote başına lokasyon + son picker çek
    // Sayfa: https://qi-fcresearch-eu.corp.amazon.com/IST2/results?s=tsXxxxxxx
    async function enrichTotesWithFcResearch(totes, totalsResp) {
        const toteIds = Object.keys(totes);
        const CONCURRENCY = 4;   // aynı anda max 4 istek
        const BATCH_SAVE_EVERY = 10; // her 10 tote'da localStorage güncelle

        let completed = 0;
        const fcrBase = 'https://qi-fcresearch-eu.corp.amazon.com';
        const fc = (FC_ID || 'IST2');

        const fetchOne = async (toteId) => {
            try {
                const url = `${fcrBase}/${fc}/results?s=${encodeURIComponent(toteId)}`;
                const r = await gmFetch(url, {timeout:10000});
                if(!r || !r.responseText) {
                    dlog(`[FCR] ${toteId} → boş yanıt`);
                    return;
                }
                const d = parseHTML(r.responseText);

                // Lokasyon: sayfada "Location" etiketli alan veya bin/aisle bilgisi
                // Genelde tablo satırında "Bin: X" / "Location: X" / "Aisle X" görünür
                let location = '';
                let lastPicker = '';

                // 1) Açık-açık "Location" etiketi var mı (tablo satırı)
                d.querySelectorAll('th, td, dt, label, .label, b, strong').forEach(el => {
                    const t = (el.textContent || '').trim().toLowerCase();
                    if(location || (t !== 'location' && t !== 'bin' && t !== 'location:' && t !== 'bin:')) return;
                    let next = el.nextElementSibling;
                    if(next) location = (next.textContent || '').trim().split('\n')[0].trim();
                });

                // 2) Page metninde regex — Amazon'un her tipi P-X-..., A-XX-..., XX-XXX-X-XX
                if(!location) {
                    const text = d.body ? d.body.textContent : '';
                    // Önce P-X-... formu (asıl aradığımız picking lokasyonu)
                    let m = text.match(/\bP-\d+-[A-Z]\d*-[A-Z]?\d*[A-Z]?\b/);
                    if(m) location = m[0];
                    if(!location) {
                        m = text.match(/\b([A-Z]{1,3}[-_]\d{1,3}[-_][A-Z][-_]\d{1,3}[A-Z]?)\b/);
                        if(m) location = m[1];
                    }
                }

                // 3) Picker: "by login" / "picked by" / username pattern
                d.querySelectorAll('a').forEach(a => {
                    if(lastPicker) return;
                    const href = a.getAttribute('href') || '';
                    if(href.includes('/employee/') || href.includes('login=')) {
                        const t = (a.textContent || '').trim();
                        if(t.match(/^[a-z][a-z0-9._-]{2,20}$/i)) lastPicker = t.toLowerCase();
                    }
                });
                if(!lastPicker) {
                    const text = d.body ? d.body.textContent : '';
                    const m = text.match(/(?:picked\s+by|picker|by)[\s:]+([a-z][a-z0-9._-]{2,20})\b/i);
                    if(m) lastPicker = m[1].toLowerCase();
                }

                // İlk 3 tote için debug log
                if (completed < 3) {
                    dlog(`[FCR] ${toteId} → loc:"${location||'—'}" picker:"${lastPicker||'—'}" htmlLen:${r.responseText.length}`);
                }

                if(totes[toteId]) {
                    if(location) totes[toteId].location = location;
                    if(lastPicker) totes[toteId].lastPicker = lastPicker;
                }
            } catch(e) {
                if (completed < 3) dlog(`[FCR] ${toteId} → hata: ${e.message || e}`);
            } finally {
                completed++;
                // Periyodik kaydet, UI görsün
                if(completed % BATCH_SAVE_EVERY === 0 || completed === toteIds.length) {
                    push('cpt_transit_batches_v9', {
                        totes,
                        cptTotals: totalsResp?.cptTotals || {},
                        cptTs:     totalsResp?.cptTs     || {},
                        grandTotal: totalsResp?.grandTotal || 0,
                        ts: Date.now(),
                        enriching: completed < toteIds.length,
                        enrichProgress: `${completed}/${toteIds.length}`
                    });
                }
            }
        };

        // Concurrency-limited queue
        const queue = toteIds.slice();
        const workers = Array.from({length: CONCURRENCY}, async () => {
            while(queue.length) {
                const id = queue.shift();
                if(!id) break;
                await fetchOne(id);
            }
        });
        await Promise.all(workers);

        console.log('[CPT10 transit] FC Research enrich done:', completed, 'totes');

        // Son kaydetme — enriching: false ile
        push('cpt_transit_batches_v9', {
            totes,
            cptTotals: totalsResp?.cptTotals || {},
            cptTs:     totalsResp?.cptTs     || {},
            grandTotal: totalsResp?.grandTotal || 0,
            ts: Date.now(),
            enriching: false
        });

        const toteCount = Object.keys(totes).length;
        const detailTotal = Object.values(totes).reduce((s,t)=>s+t.totalQty, 0);
        const withLoc = Object.values(totes).filter(t=>t.location).length;
        const withPck = Object.values(totes).filter(t=>t.lastPicker).length;
        console.log('[CPT10 transit] FINAL', toteCount, 'tote,', detailTotal, 'item /', withLoc, 'lokasyon /', withPck, 'picker');
    }

    // Rodeo: Kalan ürün sayısı
    async function fetchNotYetPicked() {
        const wf = read('cpt_workforce_v9');
        if(!wf?.data) return;

        const now=Date.now(), seen=new Set(), keys=[];
        Object.values(wf.data).forEach(v => {
            if(!v.cptTime) return;
            const [hh,mm]=v.cptTime.split(':').map(Number);
            const d=new Date(); d.setHours(hh,mm,0,0);
            let ts=d.getTime();
            if(ts<now-8*3600000) ts+=86400000;
            if(ts>now+16*3600000) ts-=86400000;
            if(ts<now-8*3600000) return;
            const k=String(Math.round(ts/60000)*60000);
            if(!seen.has(k)){seen.add(k);keys.push(k);}
        });
        if(!keys.length) return;

        const result={};
        await Promise.all(keys.map(async tsKey => {
            const ts=parseInt(tsKey);
            const r=await gmFetch(`${RODEO}/ItemList?_enabledColumns=on&WorkPool=ReadyToPick%2CPickingNotYetPicked&FulfillmentServiceClass=FASTTRACK&enabledColumns=DEMAND_ID&enabledColumns=OUTER_SCANNABLE_ID&ExSDRange.RangeStartMillis=${ts-1}&ExSDRange.RangeEndMillis=${ts+60000}&shipmentType=CUSTOMER_SHIPMENTS`);
            if(!r) return;
            const doc=parseHTML(r.responseText);
            const pager=doc.querySelector('.pager-result-size');
            const count=pager?parseInt(pager.textContent.replace(/,/g,''))||0:doc.querySelectorAll('table tbody tr').length;
            const pickers=new Set();
            doc.querySelectorAll('a[id^="openTOT-"]').forEach(a=>{const l=a.textContent.trim().toLowerCase();if(l)pickers.add(l);});
            result[tsKey]={count,pickers:[...pickers]};
        }));

        if(!Object.keys(result).length) return;

        // Rodeo'dan gelen picker CPT bilgisini wfData'ya yaz
        const wf2=read('cpt_workforce_v9');
        if(wf2?.data) {
            let changed=false;
            Object.entries(result).forEach(([tsKey,val])=>{
                if(!val?.pickers?.length) return;
                const hhmm=tsToHHMM(parseInt(tsKey));
                val.pickers.forEach(l=>{if(wf2.data[l]&&!wf2.data[l].cptTime){wf2.data[l].cptTime=hhmm;changed=true;}});
            });
            if(changed) push('cpt_workforce_v9',wf2);
        }
        push('cpt_not_yet_picked_v9',{data:result,ts:Date.now()});
    }

    // ── Interval'lar ──────────────────────────────────────
    // DOM observer — anlık (sadece değişimde)
    observeTbody(() => { clearTimeout(window._wft); window._wft=setTimeout(pushWorkforce,200); });
    setTimeout(pushWorkforce,200);
    setInterval(pushWorkforce,4000); // yedek (5sn→4sn)

    // Arka plan fetch'leri — PARALEL başlangıç (önceden kademeli 5-26sn)
    // Kritik veriler: workforce/scorecard/inScanner her 25sn, ağır olanlar 45-60sn
    // NOT: fetchTransit (transit totes) ARTIK BURADA YOK. Cross-origin sorunlu
    // olduğu için Rodeo ExSD sayfası açıkken IS_EXSD bloğu çekiyor.
    // Workforce'ta sadece cpt totals / not-yet-picked ile uğraşıyoruz.
    // v11.31: fetchPickAreas AYRI interval'da (15sn) — kullanıcı C4'ün daha hızlı yenilenmesini istedi.
    //   Scorecard 25sn yeterli; Pick Areas canlı atama için hızlı olmalı.
    const fastTasks  = [fetchWorkforcePages, fetchInScanner, fetchScorecard];
    const medTasks   = [fetchInScannerPage];
    const slowTasks  = [fetchNotYetPicked];

    // İlk yükleme — Rodeo öncelikli olduğu için workforce'u 1.2sn'ye it
    // (Rodeo ExSD sekmesi açıksa transit verisi 400ms'de gelir, workforce 1.2sn'de başlar)
    setTimeout(() => {
        [...fastTasks, ...medTasks, ...slowTasks].forEach(fn => fn().catch(()=>{}));
        // v11.31: Pick Areas ayrı — ilk fetch'i de buradan tetikle
        fetchPickAreas().catch(()=>{});
    }, 1200);

    // Refresh interval'ları
    setInterval(() => { fastTasks.forEach(fn => fn().catch(()=>{})); }, 25000);  // 25sn
    setInterval(() => { medTasks.forEach(fn => fn().catch(()=>{})); }, 45000);   // 45sn
    setInterval(() => { slowTasks.forEach(fn => fn().catch(()=>{})); }, 60000);  // 60sn
    // v11.31: Pick Areas DAHA HIZLI yenileme — 15sn (canlı atama için).
    setInterval(() => { fetchPickAreas().catch(()=>{}); }, 15000);

    // v10.59: Arka plan throttling güvencesi — Pick Console sekmesi görünür/focus
    // olunca picker verilerini (workforce/scorecard/inScanner) anında tazele.
    // Kullanıcı sekmeye dönünce güncel veri, beklemeden.
    // v11.31: Pick Areas'ı da hemen tazele.
    const _refreshFast = () => {
        fastTasks.forEach(fn => fn().catch(()=>{}));
        fetchPickAreas().catch(()=>{});
        pushWorkforce();
    };
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) setTimeout(_refreshFast, 150);
    });
    window.addEventListener('focus', () => { setTimeout(_refreshFast, 150); });
    window.addEventListener('pageshow', () => { setTimeout(_refreshFast, 300); });

    // v10.19: TRANSIT CACHE WATCHDOG
    // Rodeo ExSD sayfası açık değilse transit cache otomatik güncellenmez.
    // v12.02: Eskiden cache 120sn'den eski olunca totes={} ile silinordu → kullanıcı
    //   sekmeler arası geçince veri "kayboluyor" görüyordu. Artık:
    //   1) Eşik 120sn → 600sn (10dk) — tarayıcı background timer throttle için pay
    //   2) totes SİLİNMİYOR — sadece staleReason flag eklenir; HTML render banner ile uyarır
    //   Kullanıcının verisi her zaman görünür kalır.
    setInterval(() => {
        try {
            const cur = read('cpt_transit_batches_v9');
            if (!cur || !cur.ts) return;
            const age = (Date.now() - cur.ts) / 1000;
            const STALE_SEC = 600;   // v12.02: 120 → 600 (10dk)
            if (age > STALE_SEC) {
                // Zaten staleReason set mi? Tekrar yazma.
                if (cur.staleReason) return;
                cur.staleReason = 'Rodeo ExSD sayfası ' + Math.round(age) + 's güncellenmedi';
                cur.ts = cur.ts;  // ts'i değiştirme — yaş hesabı doğru kalsın
                push('cpt_transit_batches_v9', cur);
                dlog('⚠ Transit watchdog: ' + Math.round(age) + 's eski cache → veri KORUNDU, uyarı flag\'i set edildi (Rodeo ExSD kapalı/uyuyor olabilir)');
            }
        } catch(e) {}
    }, 30000); // 30sn'de bir kontrol

    // v10.21: HTML "🔄 60s" butonundan veya auto-refresh sayacından gelen sinyal.
    // what === 'all' veya 'workforce' geldiğinde TÜM fetch'leri paralel tetikler.
    // what === 'transit' geldiğinde Rodeo ExSD bloğu yakalar, buraya işlemez.
    // Burada güvenlik için 8sn throttle var (HTML 20sn yolluyor ama yine de korumalı).
    let _lastForceTs = 0;
    let _lastForceFetchExecTs = 0;
    const FORCE_FETCH_LOCAL_THROTTLE = 8000;
    setInterval(() => {
        try {
            let req = null;
            // 1) GM storage (cross-origin paylaşılır)
            try { req = GM_getValue('cpt_force_fetch_gm', null); } catch(e) {}
            // 2) localStorage fallback (aynı origin)
            if(!req) {
                const raw = localStorage.getItem('cpt_force_fetch');
                if(raw) req = JSON.parse(raw);
            }
            if(!req?.ts || req.ts === _lastForceTs) return;
            _lastForceTs = req.ts;
            if(Date.now() - req.ts > 30000) return; // eski istek, geç

            // 'transit' sinyali için Rodeo ExSD bloğu var, biz dokunmuyoruz
            if (req.what === 'transit' || req.what === 'transit-reload') {
                dlog('🔔 HTML→Workforce: transit sinyali alındı (Rodeo ExSD bloğu işleyecek).');
                return;
            }
            // v10.25: 'pickareas-reload' sinyali sadece IS_PICK_AREAS bloğu içindir, biz dokunmuyoruz
            if (req.what === 'pickareas-reload') {
                dlog('🔔 HTML→Workforce: pickareas-reload sinyali alındı (Pick Areas C4 bloğu işleyecek).');
                return;
            }

            // 'all' veya 'workforce' sinyalleri → tüm Picking Console fetch'lerini tetikle
            const now = Date.now();
            // v10.72: Manuel Yenile (req.force) → 8sn local throttle'ı ATLA, anında çek.
            // Auto-refresh (force yok) → 8sn koruması devam eder (Amazon rate-limit).
            if (!req.force && now - _lastForceFetchExecTs < FORCE_FETCH_LOCAL_THROTTLE) {
                dlog('⏸ Force-fetch throttle: çok erken, atlandı (' +
                     Math.round((now - _lastForceFetchExecTs)/1000) + 's geçti)');
                return;
            }
            _lastForceFetchExecTs = now;

            dlog('🔔 HTML→Workforce: force-fetch (' + (req.what || 'all') + ') → tüm fetch\'ler paralel tetikleniyor');
            // Tüm fetch'leri paralel başlat (fast + med + slow)
            // Bu sayede 60sn auto-refresh aynı anda hem workforce hem pick_areas'i yeniler
            Promise.all([
                fetchWorkforcePages().catch(e => dlog('❌ force-fetch workforce hata:', String(e))),
                fetchInScanner().catch(e => dlog('❌ force-fetch inScanner hata:', String(e))),
                fetchScorecard().catch(e => dlog('❌ force-fetch scorecard hata:', String(e))),
                fetchPickAreas().catch(e => dlog('❌ force-fetch pickAreas hata:', String(e))),
                fetchInScannerPage().catch(e => dlog('❌ force-fetch inScannerPage hata:', String(e)))
            ]).then(() => {
                dlog('✅ Force-fetch tamamlandı (' + Math.round((Date.now() - now)/1000) + 's)');
            });
        } catch(e) {}
    }, 600); // v10.72: sinyal dedektörü hızlandırıldı (auto-harvest aralıkları değişmedi)

    // Vardiya scorecard isteği dinle (GM üzerinden gelir) — hızlı tepki
    // Vardiya scorecard isteği dinle (GM üzerinden gelir) — hızlı tepki
    // Her basışta yeniden çek: reqKey'e ts dahil — aynı vardiyaya tekrar basılsa bile fetch olur
    // v11.32: Yeni POST API kullanılır. Vardiya saat aralığı (08:00-16:00 gibi) epoch'a çevrilir,
    // path'e yerleştirilir (/from/{epoch}/to/{epoch}). Cevap parse'ı tam scorecard ile aynı.
    let _lastShiftReq = '';
    let _shiftInFlight = false;
    setInterval(async () => {
        if(_shiftInFlight) return;
        try {
            let req = null;
            try { req = GM_getValue('cpt_shift_request_gm', null); } catch(e) {}
            if(!req) req = read('cpt_shift_request');
            if(!req || !req.fromTime || !req.ts) return;
            // Key'e ts ekledik — aynı vardiya butonuna ikinci kez basılırsa yine çeker
            const reqKey = req.fromTime + req.toTime + req.date + ':' + req.ts;
            if(reqKey === _lastShiftReq) return;
            if(Date.now() - req.ts > 60000) return;
            _lastShiftReq = reqKey;
            _shiftInFlight = true;

            // v11.32: Vardiya saat aralığını epoch'a çevir.
            // req.date "YYYY-MM-DD" formatında. Vardiya BUGÜN için tanımlı (eski mantık).
            // Eğer toTime '00:00' ise gece yarısını geçen vardiya → ertesi günün 00:00'ı.
            let dateStr = req.date || '';
            let dateObj;
            if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
                const parts = dateStr.split('-').map(Number);
                dateObj = new Date(parts[0], parts[1]-1, parts[2]);
            } else {
                dateObj = new Date(); dateObj.setHours(0,0,0,0);
            }
            const [fH, fM] = (req.fromTime || '00:00').split(':').map(Number);
            const [tH, tM] = (req.toTime   || '23:59').split(':').map(Number);
            const fromDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), fH, fM, 0);
            let toDate     = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), tH, tM, tH===23 && tM>=59 ? 59 : 0);
            // 16:00-00:00 gibi gece yarısını geçen vardiya: to günü +1
            if (toDate.getTime() <= fromDate.getTime()) {
                toDate = new Date(toDate.getTime() + 24*3600*1000);
            }
            const fromEpoch = Math.floor(fromDate.getTime() / 1000);
            const toEpoch   = Math.floor(toDate.getTime() / 1000);
            const apiUrl = `${PC_API}/api/fcs/${FC_ID}/reports/current-scorecard/from/${fromEpoch}/to/${toEpoch}`;

            console.log('[CPT11.32 shift] POST fetching', req.fromTime, '-', req.toTime, '→', apiUrl.substring(0,100));
            const r = await gmFetch(apiUrl, {json: true, method: 'POST', body: '{"pickProcessList":["All"]}', timeout: 15000});
            if(!r) { _shiftInFlight = false; return; }

            // Aynı parse mantığı (fullCurrentScorecardDataVector)
            const data = {};
            if (r.responseText && r.responseText.trim()[0] === '{') {
                try {
                    const obj = JSON.parse(r.responseText);
                    let items = null;
                    if (obj.activeScorecardData && Array.isArray(obj.activeScorecardData.fullCurrentScorecardDataVector)) {
                        items = obj.activeScorecardData.fullCurrentScorecardDataVector;
                    } else if (obj.activeScorecardData && Array.isArray(obj.activeScorecardData.fullCurrentScorecardData)) {
                        items = obj.activeScorecardData.fullCurrentScorecardData;
                    }
                    if (items && items.length) {
                        const _hToStr = h => {
                            const n = parseFloat(h);
                            if (isNaN(n) || n <= 0) return '';
                            const tot = Math.round(n * 3600);
                            const hh = Math.floor(tot / 3600);
                            const mm = Math.floor((tot % 3600) / 60);
                            const ss = tot % 60;
                            return String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0') + ':' + String(ss).padStart(2,'0');
                        };
                        items.forEach(item => {
                            const login = String(item.login || item.userId || item.employeeId || '').toLowerCase().trim();
                            if (!login || login.length < 3) return;
                            const perDT = parseFloat(item.perDirectTime || item.percentToDirectTime || 0) || 0;
                            const pctDT = perDT > 5 ? perDT : Math.round(perDT * 100);
                            data[login] = {
                                picks:  parseInt(item.quantityPicked || item.picks || 0) || 0,
                                actDT:  _hToStr(item.actualDirectTime || item.actualTime || 0),
                                expDT:  _hToStr(item.expectedDirectTime || item.expectedTime || 0),
                                pctDT:  pctDT,
                                dpr:    parseInt(item.directPickRate || item.pickRate || 0) || 0,
                                expPR:  parseInt(item.expectedPickRate || 0) || 0,
                                ts:     Date.now()
                            };
                        });
                    }
                } catch(e) { console.log('[CPT11.32 shift] parse error:', e.message); }
            }
            if(Object.keys(data).length) {
                const resp = {data, fromTime:req.fromTime, toTime:req.toTime, ts:Date.now()};
                try { GM_setValue('cpt_shift_scorecard_gm', resp); } catch(e){}
                push('cpt_shift_scorecard', resp);
                console.log('[CPT11.32 shift] ✅', req.fromTime, '-', req.toTime, ':', Object.keys(data).length, 'pickers');
            } else {
                // Boş cevap → "veri yok" sinyali (HTML "vardiya başlamadı" göstersin)
                const resp = {data: {}, fromTime:req.fromTime, toTime:req.toTime, ts:Date.now(), empty: true};
                try { GM_setValue('cpt_shift_scorecard_gm', resp); } catch(e){}
                push('cpt_shift_scorecard', resp);
                console.log('[CPT11.32 shift] ⚠ boş:', req.fromTime, '-', req.toTime);
            }
            _shiftInFlight = false;
        } catch(e) { _shiftInFlight = false; console.log('[CPT11.32 shift] error:', e); }
    }, 500);

    // Refresh sinyali
    let _sig='';
    try{_sig=GM_getValue('cpt_refresh_signal','');}catch(e){}
    setInterval(()=>{
        try{const s=GM_getValue('cpt_refresh_signal','');if(s&&s!==_sig){_sig=s;GM_setValue('cpt_refresh_signal','');location.reload();}}catch(e){}
    },2000);

    return;
}

// ════════════════════════════════════════════════════════
//  FC ELIGIBILITY — Pickers Dashboard (v10.86)
//  https://fc-eligibility-website-dub.aka.amazon.com/#/dashboard/IST2
//  Tablodaki her aktif picker'ın "Picker Eligibilities" hücresini okur,
//  her yetki (DefaultPicking / SingleNoSLAMPicking / SingleMediumPicking / ...)
//  için kaç picker'da olduğunu sayar. Planlama sayfası bu sayıları
//  process-path satırlarında PLAN ile MEVCUT arasında ("YETKİLİ") gösterir.
//  v11.11: Cluster (kat) değerleri AYRI "Cluster Eligibilities" sütunundan okunur
//  (pNAll → kat N, Joint_P1&2 → kat 1 ve 2) ve Multi için kat bazında sayılır.
// ════════════════════════════════════════════════════════
if (IS_ELIG) {
    dlog('🟢 FC Eligibility (Pickers Dashboard) bloğu yüklendi');

    // v11.15: Picker Eligibilities / Cluster Eligibilities alt sayfalarında scrape/reload KAPALI.
    // Bu sayfalarda kullanıcı picker/cluster seçimi yapıyor; reload ya da MutationObserver tetiklemesi
    // seçimi kaybeder. SADECE Pickers Dashboard (summary, hash="#/dashboard/IST2") yenilenir.
    // v11.23: SPA navigation — hash değişince sayfa reload OLMAZ. Page-type'ı her seferinde
    // dinamik hesapla. Picker↔Cluster↔Summary geçişinde panel/mantık güncellensin.
    function _eligPage() {
        const h = location.hash || '';
        if (/picker-eligibilit/i.test(h))  return 'picker';
        if (/cluster-eligibilit/i.test(h)) return 'cluster';
        return 'summary';
    }
    function IS_ELIG_SUMMARY_now() { return _eligPage() === 'summary'; }

    // v11.37: TÜM ATAMA OTOMASYONU DEVRE DIŞI.
    // Kullanıcı sıfırdan kurmak istedi; aşağıdaki blok sıfır iş yapar.
    // Kod kasıtlı olarak siyle YERİNDE bırakıldı, parça parça geri açılabilir.
    // Şu an sadece pushEligibility (3260+) çalışır — Summary'deki yetki sayıları.
    if (false)
    // Otomasyon HER ZAMAN kurulur (summary dahil) — panel sadece picker/cluster'da görünür.
    {
        dlog('🟢 FC Eligibility otomasyon bloğu kuruldu (aktif sayfa: ' + _eligPage() + ')');

        // ════════════════════════════════════════════════════════
        // v11.16: PICKER / CLUSTER ELIGIBILITIES OTOMASYONU
        // ════════════════════════════════════════════════════════
        // CPT Manager Picker Atama'da drag&drop ile kaydırılan picker'ları otomatik doldurur.
        // Queue: localStorage['cpt_assign_moves_v1'] = { moves: [{login, fromGrp, toGrp, paths, ts}] }
        //   - Picker Eligibilities:  path bazlı — picker'lar seçilir + (path + NonMoveablePicker) Add'e
        //   - Cluster Eligibilities: hedef gruba göre — picker'lar seçilir + eski cluster'lar silinir + grup cluster'ları Add'e
        // Update butonuna ASLA basılmaz — kullanıcı kontrolünde kalır.

        // Process Path → Eligibility name eşlemesi
        const _PP_ELIG_MAP = {
            'MultiMediumZone':      'DefaultPicking',
            'MultiMedium':          'DefaultPicking',
            'MultiWrap':            'DefaultPicking',
            'SingleNoSLAM':         'SingleNoSLAMPicking',
            'SingleMedium':         'SingleMediumPicking',
            'HOV':                  'HOVPicking',
            'HOVSLAPSmall':         'HOVPicking',
            'RebinHotpick':         'HotpickPicking',
            'Hotpick':              'HotpickPicking',
            'FracsBooks':           'FracsBooksPicking',
            'FracsBooksMPPB':       'FracsDamageBooksMPPBPicking',
            'FracsDonate':          'FracsDonatePicking',
            'FracsOverstockPickup': 'FracsOverstockPickupPicking',
            'FracsSingles':         'FracsSinglesPicking',
            'Fracs':                'FracsPicking',
            'Omniscan':             'OmniPicking',
            'QA':                   'QAPicking',
            'AMZNPhoto':            'AMZNPhotoPicking',
            'CubiscanDefault':      'CubiscanDefaultPicking'
        };
        const _ppToElig = pp => _PP_ELIG_MAP[pp] || (pp + 'Picking');

        // Kat (toGrp) → Cluster name listesi (görseldeki cluster listesinden)
        const _GRP_CLUSTERS = {
            'P1-P2': ['p1All', 'p2All'],
            'P3-P4': ['p3All', 'p4All'],
            'P5-P6': ['p5All', 'P6All']  // P6All büyük P!
        };

        const _sleep = ms => new Promise(r => setTimeout(r, ms));

        // AngularJS input set: native value + input event (ng-model bind tetiklemesi)
        function _setNgVal(input, val) {
            try {
                const proto = Object.getPrototypeOf(input);
                const setter = Object.getOwnPropertyDescriptor(proto, 'value') && Object.getOwnPropertyDescriptor(proto, 'value').set;
                if (setter) setter.call(input, val);
                else input.value = val;
            } catch (e) { input.value = val; }
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Filter input'a yaz, ng-repeat'in filtrelenmesini bekle, eşleşen <a> linkini tıkla.
        // login = "wmuacukc" → listede "Acukcu,Murat (wmuacukc@)" formatında aranır.
        async function _pickerSelect(login) {
            const want = String(login).toLowerCase().trim();
            // Zaten "Selected Pickers" listesinde mi? (li ng-repeat="picker in selectedPickers")
            // Seçili picker unselected listesinden çıkar; tekrar aramak boşuna, "zaten seçili" say.
            const selLis = document.querySelectorAll('#pickerSelector li[ng-repeat*="selectedPickers"]');
            for (const li of selLis) {
                const txt = (li.textContent || '').toLowerCase();
                if (txt.includes('(' + want + '@)') || txt.includes('(' + want + ')')) return 'already';
            }
            const f = document.querySelector('#pickerSelector input[ng-model="$parent.activePickerFilter"]');
            if (f) { _setNgVal(f, login); await _sleep(240); }
            for (let attempt = 0; attempt < 3; attempt++) {
                const links = document.querySelectorAll('#pickerSelector ul.list-unstyled li[ng-repeat*="activePicker"] a');
                for (const a of links) {
                    const txt = (a.textContent || '').toLowerCase();
                    if (txt.includes('(' + want + '@)') || txt.includes('(' + want + ')')) {
                        _fireClick(a);
                        await _sleep(100);
                        if (f) { _setNgVal(f, ''); await _sleep(70); }
                        return true;
                    }
                }
                await _sleep(180);
            }
            if (f) { _setNgVal(f, ''); await _sleep(60); }
            return false;
        }

        // "Add" tarafında eligibility/cluster ekle — filter'a yaz, eşleşen linki tıkla.
        // Picker Eligibilities → $parent.eligibilityFilter + unselectedEligibilities
        // Cluster Eligibilities → $parent.clusterFilter + unselectedClusters
        // (picker arama kutusu $parent.activePickerFilter ASLA kullanılmaz; karışmasın diye ayrı tutulur)
        // AngularJS ng-click bazen sadece .click() ile tetiklenmez — tam mouse event dizisi gönder.
        function _fireClick(el) {
            try {
                ['mousedown', 'mouseup', 'click'].forEach(type => {
                    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
                });
            } catch (e) { try { el.click(); } catch (e2) {} }
        }

        async function _eligAdd(name) {
            const want = String(name).trim().toLowerCase();
            const isCluster = _eligPage() === 'cluster';
            const f = isCluster
                ? (document.querySelector('input[ng-model="$parent.clusterFilter"]') ||
                   document.querySelector('input[ng-model="$parent.eligibilityFilter"]'))
                : (document.querySelector('input[ng-model="$parent.eligibilityFilter"]') ||
                   document.querySelector('input[ng-model="$parent.clusterFilter"]'));
            if (f) { _setNgVal(f, name); await _sleep(220); }
            for (let attempt = 0; attempt < 4; attempt++) {
                const links = document.querySelectorAll(
                    'ul.list-unstyled li[ng-repeat*="unselectedEligibilities"] a, ' +
                    'ul.list-unstyled li[ng-repeat*="unselectedClusters"] a'
                );
                for (const a of links) {
                    if ((a.textContent || '').trim().toLowerCase() === want) {
                        _fireClick(a);              // v11.21: güçlü tıklama (mousedown+mouseup+click)
                        await _sleep(120);
                        if (f) { _setNgVal(f, ''); await _sleep(70); }
                        return true;
                    }
                }
                await _sleep(170);
            }
            if (f) { _setNgVal(f, ''); await _sleep(50); }
            return false;
        }

        function _pickerClearAll() {
            try {
                const b = document.querySelector('#pickerSelector button.btn-danger[ng-click*="deselectAllPickers"]');
                if (b && getComputedStyle(b).display !== 'none') b.click();
            } catch (e) {}
        }

        // v11.21: Seçili picker'ların MEVCUT eligibility'lerini "silinecekler"e al.
        // "Remove All Eligibilities" butonu (removeAllPickersEligibilities) picker'ın tüm
        // eligibility'lerini Remove tarafına taşır → Update'te hepsi silinir.
        // Böylece Add'e koyduğumuz yeni path + NonMoveablePicker DIŞINDA eski hiçbir path kalmaz.
        async function _removeAllExistingEligs() {
            try {
                // Buton görünür olana kadar kısa bekle (picker eligibility'leri yüklenince çıkar)
                for (let i = 0; i < 8; i++) {
                    const b = document.querySelector('button[ng-click="removeAllPickersEligibilities()"]');
                    if (b && getComputedStyle(b).display !== 'none') { b.click(); await _sleep(200); return true; }
                    await _sleep(180);
                }
            } catch (e) {}
            return false;
        }

        function _loadMoves() {
            // v11.19: eligibility sayfası https:// origin'inde — HTML file:// localStorage'ını göremez.
            // Veri GM storage üzerinden köprüleniyor; önce GM, sonra localStorage fallback.
            let raw = null;
            try { raw = GM_getValue('cpt_assign_moves_v1', null); } catch (e) {}
            if (raw == null || raw === '') {
                try { raw = localStorage.getItem('cpt_assign_moves_v1'); } catch (e) {}
            }
            if (!raw) return [];
            try {
                const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
                return obj.moves || [];
            } catch (e) { return []; }
        }

        // Pipeline: Picker Eligibilities → tüm picker'lar seç + path → eligibility eklemeleri
        // Pipeline: Picker Eligibilities → BELİRLİ path için picker'ları seç + (path + NonMoveablePicker) ekle.
        // v11.20: Aynı eligibility seti tüm seçili picker'lara uygulandığı için path bazlı çalışılır.
        // Her picker'ın modaldan seçtiği tek path (m.paths[0]) gruplama anahtarıdır.
        async function _runPicker(pathFilter) {
            let moves = _loadMoves();
            if (pathFilter) moves = moves.filter(m => (m.paths && m.paths[0]) === pathFilter);
            if (!moves.length) return { okP: 0, totP: 0, okE: 0, totE: 0, missingP: [], missingE: [], removed: false };
            _pickerClearAll();
            await _sleep(350);
            const missP = [], missE = [];
            let okP = 0, okE = 0;
            for (const m of moves) {
                const r = await _pickerSelect(m.login);
                if (r === true || r === 'already') okP++; else missP.push(m.login);
            }
            // v11.21: Picker'ların MEVCUT tüm eligibility'lerini sil (Remove All) — eski path'ler kalmasın.
            await _sleep(250);  // eligibility listesi yüklensin
            const removed = await _removeAllExistingEligs();
            // Eklenecek eligibility'ler: seçilen path (zaten tam eligibility adı) + her zaman NonMoveablePicker
            const eligs = [];
            if (pathFilter) eligs.push(pathFilter);  // v11.20 fix: modal DefaultPicking/SingleMediumPicking/SingleNoSLAMPicking veriyor — direkt
            eligs.push('NonMoveablePicker');  // sabit, her zaman eklenir
            for (const e of eligs) {
                if (await _eligAdd(e)) okE++; else missE.push(e);
            }
            dlog('🚀 Picker Elig [' + (pathFilter||'?') + ']: ' + okP + '/' + moves.length + ' picker · eski elig ' + (removed?'silindi':'YOK/atlandı') + ' · ' + okE + '/' + eligs.length + ' yeni elig (' + eligs.join('+') + ') · Update bekleniyor');
            if (missP.length) dlog('  ⚠ picker bulunamadı: ' + missP.join(', '));
            if (missE.length) dlog('  ⚠ eligibility bulunamadı: ' + missE.join(', '));
            return { okP, totP: moves.length, okE, totE: eligs.length, missingP: missP, missingE: missE, removed };
        }

        // Pipeline: Cluster Eligibilities → toGrp'ye göre picker'lar seç + eski cluster'ları sil + grup cluster'ları ekle
        async function _runCluster(grp) {
            const moves = _loadMoves().filter(m => m.toGrp === grp);
            if (!moves.length) return { okP: 0, totP: 0, okC: 0, totC: 0, missingP: [], missingC: [], removed: false };
            _pickerClearAll();
            await _sleep(350);
            const missP = [], missC = [];
            let okP = 0, okC = 0;
            for (const m of moves) {
                const r = await _pickerSelect(m.login);
                if (r === true || r === 'already') okP++; else missP.push(m.login);
            }
            // v11.23: Cluster sayfasında picker'ın MEVCUT cluster'ları "Selected Picker Cluster Eligibilities"
            // (unselectedPickersEligibilities, alt liste) olarak durur ve OTOMATİK silinmez — Picker sayfasından farklı.
            // "Remove All Eligibilities" butonuna basıp hepsini silinecekler listesine al → Update'te silinsin.
            // Böylece picker'da hedef grup cluster'ı DIŞINDA eski kat (p5All/P6All vb.) kalmaz.
            await _sleep(250);
            const removed = await _removeAllExistingEligs();
            const clusters = _GRP_CLUSTERS[grp] || [];
            for (const c of clusters) {
                if (await _eligAdd(c)) okC++; else missC.push(c);
            }
            dlog('🚀 Cluster Elig (' + grp + '): ' + okP + '/' + moves.length + ' picker · eski cluster ' + (removed?'silindi':'YOK/atlandı') + ' · ' + okC + '/' + clusters.length + ' yeni cluster → eklendi · Update bekleniyor');
            if (missP.length) dlog('  ⚠ picker bulunamadı: ' + missP.join(', '));
            if (missC.length) dlog('  ⚠ cluster bulunamadı: ' + missC.join(', '));
            return { okP, totP: moves.length, okC, totC: clusters.length, missingP: missP, missingC: missC, removed };
        }

        // ── Floating panel: queue özeti + butonlar ──
        function _renderEligPanel() {
            const page = _eligPage();
            let panel = document.getElementById('cpt-elig-automation');
            // v11.23: Summary sayfasındayken paneli gösterme (sadece picker/cluster).
            if (page === 'summary') { if (panel) panel.remove(); return; }
            const moves = _loadMoves();
            if (!panel) {
                panel = document.createElement('div');
                panel.id = 'cpt-elig-automation';
                panel.style.cssText = 'position:fixed;top:80px;right:20px;background:#1c1e27;color:#e2e8f0;border:1px solid #363a4d;border-radius:10px;padding:14px 16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:13px;z-index:99999;max-width:420px;box-shadow:0 12px 36px rgba(0,0,0,.45);line-height:1.4';
                document.body.appendChild(panel);
            }
            if (!moves.length) {
                panel.innerHTML = '<div style="display:flex;align-items:center;gap:8px;opacity:.65"><span style="font-size:16px">📭</span><span>CPT Manager · Bekleyen kaydırma yok</span></div>';
                return;
            }
            const byTarget = {};
            moves.forEach(m => { (byTarget[m.toGrp] = byTarget[m.toGrp] || []).push(m); });
            // v11.24: byPath de burada (blok dışı) tanımlı — auto-run çağrısı erişebilsin.
            const byPath = {};
            moves.forEach(m => {
                const p = (m.paths && m.paths[0]) || '(seçilmedi)';
                (byPath[p] = byPath[p] || []).push(m);
            });

            let html = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
                '<span style="font-size:18px">⚡</span>' +
                '<span style="font-weight:800;color:#fff">CPT Otomatik Atama</span>' +
                '<span style="background:#ea580c;color:#fff;border-radius:10px;padding:2px 9px;font-size:11px;font-weight:700">' + moves.length + '</span>' +
                '</div>';

            if (page === 'picker') {
                html += '<div style="font-size:11px;color:#94a3b8;margin-bottom:10px">⚡ Otomatik dolar — gerekirse tekrar doldurmak için butona basın:</div>';
                html += '<div style="display:flex;flex-direction:column;gap:6px">';
                Object.entries(byPath).forEach(([path, ms]) => {
                    const noPath = path === '(seçilmedi)';
                    const elig = noPath ? 'NonMoveablePicker' : (path + ' + NonMoveablePicker');
                    html += '<button class="cpt-elig-run-path" data-path="' + (noPath ? '' : path) + '" style="background:#2563eb;color:#fff;border:none;padding:10px 12px;border-radius:7px;cursor:pointer;font-weight:700;text-align:left;font-size:12px;display:flex;align-items:center;gap:8px">' +
                        '<span style="font-size:14px">🚀</span>' +
                        '<span class="cpt-path-label"><b>' + (noPath ? '⚠ path yok' : path) + '</b> · ' + ms.length + ' picker → <span style="opacity:.8">' + elig + '</span></span>' +
                        '</button>';
                });
                html += '</div>';
            } else if (page === 'cluster') {
                html += '<div style="font-size:11px;color:#94a3b8;margin-bottom:10px">⚡ Otomatik dolar — gerekirse tekrar doldurmak için butona basın:</div>';
                html += '<div style="display:flex;flex-direction:column;gap:6px">';
                Object.entries(byTarget).forEach(([grp, ms]) => {
                    const cls = _GRP_CLUSTERS[grp] || [];
                    html += '<button class="cpt-elig-run-grp" data-grp="' + grp + '" style="background:#16a34a;color:#fff;border:none;padding:10px 12px;border-radius:7px;cursor:pointer;font-weight:700;text-align:left;font-size:12px;display:flex;align-items:center;gap:8px">' +
                        '<span style="font-size:14px">🚀</span>' +
                        '<span class="cpt-grp-label"><b>' + grp + '</b> → ' + ms.length + ' picker · ' + cls.join(', ') + '</span>' +
                        '</button>';
                });
                html += '</div>';
            }
            html += '<div style="font-size:11px;color:#fcd34d;margin-top:11px;display:flex;align-items:flex-start;gap:6px;line-height:1.5">' +
                '<span style="flex-shrink:0">⚠</span>' +
                '<span><b>Update butonuna SİZ basacaksınız</b> — otomasyon kesinlikle basmaz.</span>' +
                '</div>';

            panel.innerHTML = html;

            if (page === 'picker') {
                document.querySelectorAll('.cpt-elig-run-path').forEach(b => {
                    b.onclick = async () => {
                        const path = b.dataset.path;  // '' ise sadece NonMoveablePicker
                        b.disabled = true; b.style.opacity = '.75';
                        const lbl = b.querySelector('.cpt-path-label');
                        const orig = lbl.textContent;
                        lbl.textContent = '⏳ dolduruluyor...';
                        const r = await _runPicker(path);
                        b.style.background = (r.okP === r.totP && r.okE === r.totE) ? '#16a34a' : '#d97706';
                        lbl.textContent = '✓ ' + r.okP + '/' + r.totP + ' picker · ' + r.okE + '/' + r.totE + ' elig — Update\'e basın';
                        b.style.opacity = '1';
                    };
                });
            } else if (page === 'cluster') {
                document.querySelectorAll('.cpt-elig-run-grp').forEach(b => {
                    b.onclick = async () => {
                        const grp = b.dataset.grp;
                        b.disabled = true; b.style.opacity = '.75';
                        b.querySelector('.cpt-grp-label').textContent = grp + ' · ⏳ dolduruluyor...';
                        const r = await _runCluster(grp);
                        b.style.background = r.okP === r.totP && r.okC === r.totC ? '#0d9488' : '#d97706';
                        b.querySelector('.cpt-grp-label').textContent = '✓ ' + grp + ' · ' + r.okP + '/' + r.totP + ' picker · ' + r.okC + '/' + r.totC + ' cl — Update\'e basın';
                        b.style.opacity = '1';
                    };
                });
            }

            // v11.24: OTOMATİK DOLDURMA — kullanıcı "Doldur" butonuna basmasın.
            // Bu sayfaya (picker/cluster) girince bekleyen kaydırmalar otomatik işlensin.
            // Her (sayfa + path/grup + queue-imzası) kombinasyonu BİR KEZ çalışır → tekrar/döngü olmaz.
            // Update'e basıp queue temizlenince imza değişir, yeni kaydırmada tekrar dolar.
            _autoRunEligPanel(page, byPath, byTarget);
        }

        // v11.24: Otomatik doldurma guard'ı. Aynı işi tekrar tekrar tetiklememek için
        // "sayfa|anahtar|imza" kombinasyonlarını hatırlar. Doldurma asenkron, sırayla çalışır.
        const _autoRunDone = new Set();
        let _autoRunBusy = false;
        async function _autoRunEligPanel(page, byPath, byTarget) {
            if (_autoRunBusy) return;
            if (page !== 'picker' && page !== 'cluster') return;
            const sig = _queueSig();
            // İşlenecek (anahtar → buton tipi) listesi
            const tasks = [];
            if (page === 'picker') {
                Object.keys(byPath || {}).forEach(p => {
                    const path = p === '(seçilmedi)' ? '' : p;
                    const key = 'picker|' + path + '|' + sig;
                    if (!_autoRunDone.has(key)) tasks.push({ key, kind: 'picker', arg: path });
                });
            } else {
                Object.keys(byTarget || {}).forEach(grp => {
                    const key = 'cluster|' + grp + '|' + sig;
                    if (!_autoRunDone.has(key)) tasks.push({ key, kind: 'cluster', arg: grp });
                });
            }
            if (!tasks.length) return;
            _autoRunBusy = true;
            try {
                for (const t of tasks) {
                    _autoRunDone.add(t.key);
                    dlog('⚡ Otomatik dolduruluyor: ' + t.kind + ' · ' + (t.arg || '(path yok)'));
                    if (t.kind === 'picker') await _runPicker(t.arg);
                    else await _runCluster(t.arg);
                    await _sleep(300);
                }
                // Doldurma bitince paneli güncelle (buton etiketleri "Update'e basın"a dönsün)
                _renderEligPanel();
            } catch (e) { dlog('⚠ otomatik doldurma hatası: ' + e); }
            finally { _autoRunBusy = false; }
        }

        // İlk panel + queue değişikliklerinde periyodik refresh.
        // v11.19: GM storage event yaymaz; queue imzasını izleyip değişince hızlı güncelle.
        let _lastQueueSig = '';
        function _queueSig() {
            try {
                const raw = GM_getValue('cpt_assign_moves_v1', null);
                return raw == null ? '' : (typeof raw === 'string' ? raw : JSON.stringify(raw));
            } catch (e) { return ''; }
        }
        setTimeout(_renderEligPanel, 1500);
        setInterval(() => {
            const sig = _queueSig();
            if (sig !== _lastQueueSig) { _lastQueueSig = sig; _renderEligPanel(); }
        }, 1000);
        setInterval(_renderEligPanel, 5000);
        window.addEventListener('storage', e => {
            if (e.key === 'cpt_assign_moves_v1') _renderEligPanel();
        });
        // ════════════════════════════════════════════════════════
        // v11.25: 3 AŞAMALI OTOMATİK YÖNLENDİRME
        // ════════════════════════════════════════════════════════
        // Atama yapılınca (queue dolu) tek eligibility sekmesinde sırayla:
        //   1) Picker Eligibilities  → otomatik dolar → kullanıcı Update'e basar → otomatik Cluster'a geç
        //   2) Cluster Eligibilities → otomatik dolar → kullanıcı Update'e basar → otomatik Summary'ye dön
        //   3) Summary → normal scrape/refresh çalışmasına devam
        // Atama YOKKEN (queue boş) Summary hiç dokunulmadan eski haliyle çalışır.
        // Aşama durumu GM'de tutulur (sekme yenilense de korunur). Navigasyon SPA hash ile.
        const _NAV_KEY = 'cpt_elig_nav_stage';   // '', 'picker', 'cluster', 'done'
        const _HASH_SUMMARY = '#/dashboard/IST2';
        const _HASH_PICKER  = '#/dashboard/IST2/picker-eligibilities';
        const _HASH_CLUSTER = '#/dashboard/IST2/cluster-eligibilities';

        // v11.33: FC seçim ekranı tespiti + IST2 otomatik seçimi.
        // Sayfa yenilenince veya ilk açılışta FC seçim ekranı (DUB/IAD/NRT tab'ı + ABF1/ABS5/... FC listesi)
        // çıkıyor; gerçek picker-eligibilities yüklenemiyor. Bu fonksiyon IST2'yi otomatik tıklar,
        // sonra otomatik Summary'ye atar.
        function _looksLikeFcPicker() {
            // FC seçim ekranı belirteci: sayfada "IST2" linki/butonu var ve gerçek panel yok.
            // Sayfada DUB/IAD/NRT tab'ları + birçok FC kodu (ABF1, ABS5, ...) listelenir.
            // Eligibility paneli (#pickerSelector) yoksa ve "IST2" text'i tıklanabilirse → seçim ekranındayız.
            try {
                const hasPickerSelector = !!document.querySelector('#pickerSelector');
                if (hasPickerSelector) return false;
                // IST2 yazılı tıklanabilir bir eleman var mı?
                const cands = document.querySelectorAll('a, button, [ng-click], li, span');
                for (const el of cands) {
                    const txt = (el.textContent || '').trim();
                    if (txt === 'IST2' || /^IST2$/.test(txt)) {
                        if (el.offsetParent !== null) return true;  // görünür
                    }
                }
                return false;
            } catch (e) { return false; }
        }
        function _clickIST2() {
            try {
                // Önce ng-click içerenleri ara, sonra <a>/<button>, en son span/li
                const all = [
                    ...document.querySelectorAll('[ng-click]'),
                    ...document.querySelectorAll('a'),
                    ...document.querySelectorAll('button'),
                    ...document.querySelectorAll('li'),
                    ...document.querySelectorAll('span')
                ];
                for (const el of all) {
                    const txt = (el.textContent || '').trim();
                    if (txt !== 'IST2') continue;
                    if (el.offsetParent === null) continue;  // görünmez
                    // Tıkla (mouse event dizisi — AngularJS ng-click için)
                    try {
                        ['mousedown', 'mouseup', 'click'].forEach(type => {
                            el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
                        });
                    } catch (e) { try { el.click(); } catch (e2) {} }
                    dlog('🎯 IST2 otomatik seçildi (FC seçim ekranından)');
                    return true;
                }
            } catch (e) {}
            return false;
        }

        function _navGet() { try { return GM_getValue(_NAV_KEY, '') || ''; } catch (e) { return ''; } }
        function _navSet(v) { try { GM_setValue(_NAV_KEY, v); } catch (e) {} }
        function _hasMoves() { return _loadMoves().length > 0; }

        // v11.35: HASH DEĞİL, GERÇEK NAV LİNKE TIKLA.
        // Bu SPA'da location.hash = '...' atayınca sayfa bazen spinner'da takılıyor.
        // Kullanıcı manuel tıklayınca (navbar linkleri) sorunsuz geçiyor. Selektör:
        //   #eligweb-navbar-menu li ng-click="navCtrl.setCurrentView(view.path)"
        //   içindeki <a> text'i: "Summary" / "Picker Eligibilities" / "Cluster Eligibilities"
        function _clickNavLink(linkText) {
            try {
                const lis = document.querySelectorAll('#eligweb-navbar-menu li');
                for (const li of lis) {
                    const a = li.querySelector('a');
                    if (!a) continue;
                    const txt = (a.textContent || '').trim();
                    if (txt === linkText) {
                        // li üzerindeki ng-click ile <a>'ya tıklama — ikisini de mouse event dizisiyle uyandır
                        ['mousedown', 'mouseup', 'click'].forEach(type => {
                            a.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
                            li.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
                        });
                        return true;
                    }
                }
            } catch (e) {}
            return false;
        }
        // Hash → menü metni eşlemesi
        function _hashToLink(hash) {
            if (hash === _HASH_PICKER)  return 'Picker Eligibilities';
            if (hash === _HASH_CLUSTER) return 'Cluster Eligibilities';
            if (hash === _HASH_SUMMARY) return 'Summary';
            return '';
        }

        let _lastGoTs = 0;
        function _go(hash) {
            if (location.hash === hash) return;
            // v11.27: Cooldown — son yönlendirmeden 3sn geçmeden tekrar yönlendirme yapma.
            const now = Date.now();
            if (now - _lastGoTs < 3000) return;
            _lastGoTs = now;
            const linkText = _hashToLink(hash);
            // v11.35: Önce navbar linkine tıklamayı dene (sorunsuz geçiş). Bulamazsa hash'e düş.
            if (linkText && _clickNavLink(linkText)) {
                dlog('➡️ Nav linki tıklandı: ' + (location.hash||'(summary)') + ' → ' + linkText);
            } else {
                dlog('➡️ Yönlendiriliyor (hash fallback): ' + (location.hash||'(summary)') + ' → ' + hash);
                location.hash = hash;
            }
            // Spinner watchdog yine devrede (her ihtimale karşı)
            _watchdogTarget = hash;
            _watchdogAt = now;
            setTimeout(() => _spinnerWatchdog(hash), 5000);
        }

        let _watchdogTarget = '';
        let _watchdogAt = 0;
        let _watchdogReloadedFor = '';
        function _looksStuck() {
            // v11.34: SIKILAŞTIRILDI — eski versiyon "[ng-repeat]" gibi şablon kalıntılarını
            // "içerik var" sayıp reload yapmıyordu. Artık picker/cluster sayfasında SADECE
            // GÖRÜNÜR #pickerSelector "gerçek içerik" sayılır.
            const page = _eligPage();
            let hasContent;
            if (page === 'picker' || page === 'cluster') {
                const sel = document.querySelector('#pickerSelector');
                hasContent = !!(sel && sel.offsetParent !== null && (sel.textContent || '').trim().length > 20);
            } else {
                // Summary veya diğerleri: eskisi gibi geniş kontrol
                hasContent =
                    document.querySelector('#pickerSelector') ||
                    document.querySelector('.well') ||
                    document.querySelector('table tbody tr') ||
                    document.querySelector('[ng-repeat]');
            }
            const spinnerVisible = (() => {
                const sels = ['.loading', '.spinner', '[class*="spinner"]', '[class*="loading"]', '.fa-spinner', '.fa-spin'];
                for (const s of sels) {
                    const el = document.querySelector(s);
                    if (el && el.offsetParent !== null) return true;  // görünür spinner
                }
                return false;
            })();
            // "Takıldı" = içerik yok VE (spinner görünür veya body neredeyse boş)
            const bodyTextLen = (document.body && document.body.textContent || '').trim().length;
            return !hasContent && (spinnerVisible || bodyTextLen < 200);
        }
        function _spinnerWatchdog(expectedHash) {
            try {
                // Hâlâ aynı hedefteyiz ve bu hedef için daha önce reload yapmadıysak
                if (location.hash !== expectedHash) return;       // kullanıcı/sistem başka yere gitti
                if (_watchdogReloadedFor === expectedHash) return; // bu hedef için zaten bir kez denedik
                if (!_looksStuck()) return;                        // sayfa düzgün yüklendi, sorun yok
                _watchdogReloadedFor = expectedHash;
                dlog('🔄 Sayfa spinner\'da takıldı (' + expectedHash + ') → tam reload ile toparlanıyor');
                location.reload();
            } catch (e) {}
        }

        // Atama başlatma: v11.36'dan itibaren KULLANICI BUTON İLE BAŞLATIR.
        // HTML'deki "Atamayı Başlat" butonu cpt_elig_flow_start sinyalini yollar.
        // Bu sinyal görülmeden atama olsa bile otomatik yönlendirme YAPILMAZ —
        // kullanıcı birkaç picker'ı toplu modal'da işleyebilsin diye.
        const _FLOW_START_KEY = 'cpt_elig_flow_start';   // {ts}  HTML basınca yazar
        function _maybeStartFlow() {
            if (!_hasMoves()) {
                // Atama yok → akış sıfırla (Summary serbest çalışsın)
                if (_navGet()) { _navSet(''); dlog('🟦 Atama kuyruğu boş → yönlendirme akışı sıfırlandı'); }
                return;
            }
            const stage = _navGet();
            // v11.25 fix: 'done' aşaması = akış tamamlandı ama queue henüz temizlenmemiş olabilir
            // (kullanıcı Update'e bastı, HTML/temizlik gecikti). Tekrar başlatma → döngü önle.
            if (stage === 'done') return;
            if (!stage) {
                // v11.36: Sinyal var mı? Yoksa OTOMATİK BAŞLATMA — kullanıcı butona basana kadar bekle.
                let sig = null;
                try { sig = GM_getValue(_FLOW_START_KEY, null); } catch (e) {}
                if (!sig || !sig.ts) return;                  // sinyal yok → bekle
                if (Date.now() - sig.ts > 60000) return;      // çok eski sinyal → atla
                if (sig.ts === _lastFlowStartSeen) return;    // bu sinyali zaten işledik
                _lastFlowStartSeen = sig.ts;
                // Akışı başlat
                _navSet('picker');
                dlog('🟩 "Atamayı Başlat" sinyali alındı → Picker Eligibilities aşaması başlıyor');
                _go(_HASH_PICKER);
            }
        }
        let _lastFlowStartSeen = 0;

        // Update butonuna basışı izle → aşamayı ilerlet + sonraki sayfaya yönlendir.
        // Picker Update  → aşama 'cluster', Cluster'a git
        // Cluster Update → aşama 'done', Summary'ye dön (+ kısa süre sonra akış sıfırı)
        let _updateHooked = false;
        function _hookUpdateButton() {
            const page = _eligPage();
            if (page !== 'picker' && page !== 'cluster') { _updateHooked = false; return; }
            // Update butonu (sayfa tipine göre)
            let btn = null;
            if (page === 'picker') {
                btn = document.querySelector('button[ng-click="pickerEligCtrl.validationChecksForEligibility()"]') ||
                      document.querySelector('button[ng-click*="validationChecksForEligibility"]');
            } else {
                btn = document.querySelector('button[ng-click*="updateSelectedClusterEligibilities"]') ||
                      document.querySelector('button[ng-click*="ClusterEligibilities"]') ||
                      document.querySelector('button[ng-click*="pdateSelectedCluster"]');
            }
            // Fallback: ng-click bulunamazsa buton metninden yakala ("Update selected ... eligibilities")
            if (!btn) {
                const cands = Array.from(document.querySelectorAll('button, a.btn, input[type="submit"]'));
                btn = cands.find(b => {
                    const t = (b.textContent || b.value || '').trim().toLowerCase();
                    return /update\s+selected.*eligibilit/.test(t) ||
                           (page === 'picker' && /^update\b/.test(t) && /eligibilit/.test(t)) ||
                           (page === 'cluster' && /update.*cluster/.test(t));
                }) || null;
            }
            if (!btn) return;
            if (btn.dataset.cptNavHook === '1') return;  // zaten bağlı
            btn.dataset.cptNavHook = '1';
            btn.addEventListener('click', () => {
                // Kullanıcı Update'e bastı — kısa gecikmeyle (işlem başlasın) sonraki aşamaya geç.
                const p = _eligPage();
                dlog('✅ Update tıklandı (' + p + ') — sonraki aşamaya geçiliyor');
                if (p === 'picker') {
                    _navSet('cluster');
                    setTimeout(() => _go(_HASH_CLUSTER), 1200);
                } else if (p === 'cluster') {
                    _navSet('done');
                    setTimeout(() => {
                        _go(_HASH_SUMMARY);
                        // v11.25: Atama tamamlandı (Picker+Cluster Update'lendi) → queue'yu temizle.
                        // GM'den silinince file:// köprüsü HTML localStorage'ını da temizler (çift yönlü).
                        // Böylece Picker Atama'daki bekleyen kaydırma kalkar, akış 'done'→boş→hazır olur.
                        try {
                            if (typeof GM_deleteValue === 'function') { try { GM_deleteValue('cpt_assign_moves_v1'); } catch(e){} }
                            GM_setValue('cpt_assign_moves_v1', JSON.stringify({ moves: [], ts: Date.now() }));
                            dlog('🧹 Atama tamamlandı → kuyruk temizlendi');
                        } catch (e) {}
                        setTimeout(() => { _navSet(''); }, 1500);
                    }, 1200);
                }
            }, { once: true });
            dlog('🔗 Update butonu izleniyor (' + page + ')');
        }

        // Akış kontrolü: queue + aşama + mevcut sayfa uyumunu sürekli denetle.
        // - Yeni atama → Picker'a götür
        // - Update sonrası aşama ilerledi → ilgili sayfaya götür (sayfa açıksa hook bağla)
        let _fcAutoSelectedAt = 0;  // IST2 tıklamadan sonra cooldown
        function _navTick() {
            // v11.33: FC seçim ekranı kontrolü — sayfa yenilenince veya ilk açılışta
            // DUB/IAD/NRT + FC listesi görünür, gerçek panel yüklenmemiş olabilir.
            // IST2'yi tıkla → Home'a gider → otomatik Summary'ye yönlendir.
            if (_looksLikeFcPicker()) {
                if (Date.now() - _fcAutoSelectedAt > 4000) {  // 4sn cooldown
                    if (_clickIST2()) {
                        _fcAutoSelectedAt = Date.now();
                        // v11.33: IST2 tıklayınca SPA hash'i değişiyor (genelde /home veya FC ana sayfası).
                        // 1.5sn sonra zorla Summary'ye git — kullanıcı Home'da takılmasın.
                        setTimeout(() => {
                            if (location.hash !== _HASH_SUMMARY) {
                                dlog('🏠 IST2 sonrası Summary\'ye yönlendiriliyor (mevcut: ' + (location.hash||'(boş)') + ')');
                                location.hash = _HASH_SUMMARY;
                            }
                        }, 1500);
                    }
                }
                return;  // FC seçim ekranındayken normal akış işlemesin
            }

            const stage = _navGet();
            const page = _eligPage();
            // v11.27: 'done' aşaması — akış bitti. Summary'de takılmayı önle: HİÇBİR yönlendirme yapma,
            // queue henüz temizlenmemiş olsa bile. Queue boşalınca _maybeStartFlow sıfırlar.
            if (stage === 'done') {
                if (!_hasMoves()) { _navSet(''); }  // queue boşaldıysa hazır duruma dön
                return;
            }
            _maybeStartFlow();
            if (!_hasMoves()) return;
            const stage2 = _navGet();
            // Aşamaya göre doğru sayfada mıyız? Değilsek götür. (Sadece picker/cluster aşamasında.)
            if (stage2 === 'picker' && page === 'cluster') _go(_HASH_PICKER);
            else if (stage2 === 'cluster' && page === 'picker') _go(_HASH_CLUSTER);
            // v11.27: Summary'den picker/cluster'a SADECE akış yeni başladıysa (_maybeStartFlow içinde) gidilir.
            // navTick döngüsünde Summary'deyken zorla yönlendirme YOK — spinner/reload döngüsü olmasın.
            // Doğru sayfadaysak Update butonunu izlemeye al
            if ((stage2 === 'picker' && page === 'picker') || (stage2 === 'cluster' && page === 'cluster')) {
                _hookUpdateButton();
            }
        }
        setTimeout(_navTick, 2500);
        setInterval(_navTick, 2000);

        // v11.34: BAĞIMSIZ genel spinner watchdog — _go dışındaki takılmaları da yakalar.
        // Picker/cluster sayfasında ARALIKSIZ 5sn takılı → reload. Summary için 7sn.
        // Aynı hash için 2 reload denemesi (ilki çözmezse ikincisi farklı zamana denk gelir).
        let _stuckSince = 0;
        const _globalReloadCount = {};  // {hash: kaç kez reload edildi}
        setInterval(() => {
            try {
                const stuck = _looksStuck();
                if (!stuck) { _stuckSince = 0; return; }
                if (_stuckSince === 0) { _stuckSince = Date.now(); return; }
                const stuckFor = Date.now() - _stuckSince;
                const curHash = location.hash || '(summary)';
                const page = _eligPage();
                // v11.34: picker/cluster için DAHA AGRESİF (5sn), summary için 7sn.
                const threshold = (page === 'picker' || page === 'cluster') ? 5000 : 7000;
                const reloadsForThisHash = _globalReloadCount[curHash] || 0;
                // En fazla 2 reload denemesi — 3. kez aynı hash takılırsa kullanıcıya bırak.
                if (stuckFor >= threshold && reloadsForThisHash < 2) {
                    _globalReloadCount[curHash] = reloadsForThisHash + 1;
                    _stuckSince = 0;
                    dlog('🔄 Genel watchdog: ' + page + ' ' + Math.round(stuckFor/1000) + 'sn spinner\'da → reload (#' + (reloadsForThisHash+1) + ')');
                    location.reload();
                }
            } catch (e) {}
        }, 1500);

        // v11.23: SPA sayfa geçişi (Picker↔Cluster↔Summary) — hash değişince paneli yeniden çiz.
        // Reload olmadığı için page-type dinamik; panel doğru butonları göstersin.
        let _lastHash = location.hash;
        window.addEventListener('hashchange', () => {
            dlog('🔀 FC Eligibility hash değişti: ' + _lastHash + ' → ' + location.hash + ' (panel yenileniyor)');
            _lastHash = location.hash;
            setTimeout(_renderEligPanel, 400);
            setTimeout(_navTick, 500);
        });
        // Yedek: bazı SPA'lar hashchange yaymaz; hash'i poll et.
        setInterval(() => {
            if (location.hash !== _lastHash) {
                _lastHash = location.hash;
                _renderEligPanel();
            }
        }, 700);
    }

    // ────────────────────────────────────────────────────────
    // v11.38: SIFIRDAN — MİNİ FC SEÇİM EKRANI → SUMMARY GEÇİŞİ
    // ────────────────────────────────────────────────────────
    // Sayfa açıldığında veya yenilenince FC seçim ekranı (DUB/IAD/NRT tab + ABF1/ABS5/... FC listesi)
    // gösteriliyorsa: IST2'yi bir kez tıkla, sonra Summary'ye geç.
    // BAŞKA HİÇBİR ŞEY YAPMA. Reload yok, watchdog yok, panel yok, doldurma yok.
    // "Tek seferlik": her sayfa yüklemesinde EN FAZLA bir tıklama denemesi yapar, sonra durur.
    (function _miniFcAutoIST2() {
        let _attempted = false;   // bu sayfa yüklemesinde denedik mi
        let _done = false;        // başarıyla geçtik mi → tamamen sus

        function _looksLikeFcSelectionScreen() {
            try {
                // FC seçim ekranı belirteci:
                //   1) Picker selector paneli YOK
                //   2) "IST2" yazılı tıklanabilir bir eleman GÖRÜNÜR durumda
                if (document.querySelector('#pickerSelector')) return false;
                const cands = document.querySelectorAll('a, button, [ng-click], li, span');
                for (const el of cands) {
                    const txt = (el.textContent || '').trim();
                    if (txt === 'IST2' && el.offsetParent !== null) return true;
                }
                return false;
            } catch (e) { return false; }
        }

        function _clickIST2Once() {
            const all = [
                ...document.querySelectorAll('[ng-click]'),
                ...document.querySelectorAll('a'),
                ...document.querySelectorAll('button'),
                ...document.querySelectorAll('li'),
                ...document.querySelectorAll('span')
            ];
            for (const el of all) {
                const txt = (el.textContent || '').trim();
                if (txt !== 'IST2') continue;
                if (el.offsetParent === null) continue;
                try {
                    ['mousedown', 'mouseup', 'click'].forEach(type => {
                        el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
                    });
                } catch (e) { try { el.click(); } catch(e2) {} }
                dlog('🎯 [mini] IST2 tıklandı (FC seçim ekranı tespit edildi)');
                return true;
            }
            return false;
        }

        function _clickSummaryLink() {
            // v11.41: IST2 tıklama mantığının AYNISI — tüm elemanlarda text "Summary" eşleşmesi ara.
            // navbar yapısı, ng-click yeri, vs. takılı kalmasın — eleman ne olursa olsun text doğruysa tıkla.
            try {
                const all = [
                    ...document.querySelectorAll('[ng-click]'),
                    ...document.querySelectorAll('a'),
                    ...document.querySelectorAll('button'),
                    ...document.querySelectorAll('li'),
                    ...document.querySelectorAll('span')
                ];
                for (const el of all) {
                    const txt = (el.textContent || '').trim();
                    if (txt !== 'Summary') continue;
                    if (el.offsetParent === null) continue;  // görünmez
                    try {
                        ['mousedown', 'mouseup', 'click'].forEach(type => {
                            el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, button: 0 }));
                        });
                    } catch (e) { try { el.click(); } catch(e2) {} }
                    dlog('🏠 [mini] Summary tıklandı (' + el.tagName + ')');
                    return true;
                }
            } catch(e) {}
            return false;
        }

        // v11.39: Summary tıklamayı RETRY ile yap.
        // FC seçim ekranından çıkıp Home'a düştüğümüzde navbar bir an gecikebilir.
        // 500ms aralıkla 5 saniye boyunca dene, ilk başaran tıklamada dur.
        function _trySummaryWithRetry() {
            let tries = 0;
            const maxTries = 10;  // 10 × 500ms = 5sn
            const iv = setInterval(() => {
                tries++;
                if (_clickSummaryLink()) {
                    clearInterval(iv);
                    return;
                }
                if (tries >= maxTries) {
                    clearInterval(iv);
                    dlog('⚠ [mini] Summary linki 5sn boyunca bulunamadı (navbar gelmedi)');
                }
            }, 500);
        }

        // 1 saniyede bir kontrol et — hızlı tepki, ama tek seferlik
        const _iv = setInterval(() => {
            if (_done) { clearInterval(_iv); return; }
            if (_attempted) {
                // Bir denedik; FC seçim ekranı hâlâ duruyor mu? Hayırsa = geçtik.
                if (!_looksLikeFcSelectionScreen()) {
                    _done = true;
                    clearInterval(_iv);
                    // v11.39: Picker selector görünür hâle geldi → Summary'ye RETRY ile git
                    // (navbar bir an gecikebilir, 5sn boyunca denenir).
                    setTimeout(() => { _trySummaryWithRetry(); }, 500);
                }
                return;
            }
            if (_looksLikeFcSelectionScreen()) {
                _attempted = true;
                _clickIST2Once();
            }
        }, 1000);

        // v11.41: ÖNEMLİ ek senaryo — sayfa ZATEN Home'da yükleniyor olabilir (örn. yenileme).
        // FC seçim ekranı yok ama Summary'ye geçmek istiyoruz.
        // Her saniyede bir kontrol et: navbar yüklendiyse + Home aktifse → Summary'ye geç.
        let _homeCheckTries = 0;
        const _homeIv = setInterval(() => {
            _homeCheckTries++;
            if (_done) { clearInterval(_homeIv); return; }
            if (_homeCheckTries > 15) { clearInterval(_homeIv); return; }  // 15sn sonra vazgeç
            try {
                // Navbar görünür mü? Hem "Home" hem "Summary" görünür durumda olmalı.
                let foundHome = null, foundSummary = null;
                const items = document.querySelectorAll('#eligweb-navbar-menu li, #eligweb-navbar-menu a');
                for (const el of items) {
                    const txt = (el.textContent || '').trim();
                    if (txt === 'Home' && el.offsetParent !== null) foundHome = el;
                    if (txt === 'Summary' && el.offsetParent !== null) foundSummary = el;
                }
                if (!foundHome || !foundSummary) return;  // navbar henüz hazır değil
                // Home aktif mi?
                const homeLi = foundHome.closest('li') || foundHome;
                const isHomeActive = homeLi.classList && homeLi.classList.contains('active');
                if (isHomeActive) {
                    _done = true;
                    clearInterval(_homeIv);
                    clearInterval(_iv);
                    dlog('🏠 [mini] Sayfa Home\'da → Summary\'ye geçiliyor');
                    _trySummaryWithRetry();
                }
            } catch(e) {}
        }, 1000);

        // En fazla 30 saniye kontrol et, sonra tamamen durdur (döngü/spam olmasın)
        setTimeout(() => { _done = true; clearInterval(_iv); }, 30000);
    })();


    // ────────────────────────────────────────────────────────
    // v11.42: ATAMA OTOMASYONU — basit state machine (SIFIRDAN)
    // ────────────────────────────────────────────────────────
    // Akış:
    //   1) Queue'da picker var + Summary sayfasındayız → Picker Eligibilities'e geç
    //   2) Picker Eligibilities'te: queue'daki HER picker için sırayla
    //        a) Picker'ı seç
    //        b) "Remove All Eligibilities" tıkla (eski path'leri sil)
    //        c) move.paths içindeki her path için eligibility ekle + NonMoveablePicker ekle
    //        d) Update'e bas
    //        e) Sonraki picker
    //   3) Tüm picker'lar bittikten sonra → Cluster Eligibilities'e geç
    //   4) Cluster Eligibilities'te: queue'daki HER picker için sırayla
    //        a) Picker'ı seç
    //        b) "Remove All Eligibilities" tıkla
    //        c) move.toGrp (P1-P2/P3-P4/P5-P6) → cluster'ları ekle (p1All+p2All vb)
    //        d) Update'e bas
    //        e) Sonraki picker
    //   5) Summary'ye dön → queue'yu temizle
    //
    // Tetikleyici: queue dolu + Summary'deyiz. Başka koşul yok.
    // Watchdog/reload/FC-auto-click HİÇ YOK — sadece DOM olayları.
    (function _assignmentFlow() {
        // İzole yardımcılar (eski blok if(false) içinde mahzun, oradan almıyorum)
        const _sleep = ms => new Promise(r => setTimeout(r, ms));

        // Process Path → Eligibility name
        const _PP_ELIG_MAP = {
            'MultiMediumZone':      'DefaultPicking',
            'MultiMedium':          'DefaultPicking',
            'MultiWrap':            'DefaultPicking',
            'SingleNoSLAM':         'SingleNoSLAMPicking',
            'SingleMedium':         'SingleMediumPicking',
            'HOV':                  'HOVPicking',
            'HOVSLAPSmall':         'HOVPicking',
            'RebinHotpick':         'HotpickPicking',
            'Hotpick':              'HotpickPicking',
            'FracsBooks':           'FracsBooksPicking',
            'FracsBooksMPPB':       'FracsDamageBooksMPPBPicking',
            'FracsDonate':          'FracsDonatePicking',
            'FracsOverstockPickup': 'FracsOverstockPickupPicking',
            'FracsSingles':         'FracsSinglesPicking',
            'Fracs':                'FracsPicking',
            'Omniscan':             'OmniPicking',
            'QA':                   'QAPicking',
            'AMZNPhoto':            'AMZNPhotoPicking',
            'CubiscanDefault':      'CubiscanDefaultPicking'
        };
        function _ppToElig(pp) {
            if (!pp) return null;
            // "PPMultiMedium" → "MultiMedium" (PP prefix sok at)
            const k = pp.replace(/^PP/, '');
            if (_PP_ELIG_MAP[k]) return _PP_ELIG_MAP[k];
            // Already in eligibility form?
            if (k.endsWith('Picking')) return k;
            return k + 'Picking';
        }

        // Kat (toGrp) → Cluster name listesi (FCEligibility'deki cluster isimleri)
        const _GRP_CLUSTERS = {
            'P1-P2': ['p1All', 'p2All'],
            'P3-P4': ['p3All', 'p4All'],
            'P5-P6': ['p5All', 'P6All']  // P6All BÜYÜK P!
        };

        function _eligPageNow() {
            const h = location.hash || '';
            if (/picker-eligibilit/i.test(h))  return 'picker';
            if (/cluster-eligibilit/i.test(h)) return 'cluster';
            return 'summary';
        }

        function _fireClick(el) {
            try {
                ['mousedown', 'mouseup', 'click'].forEach(type => {
                    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, button: 0 }));
                });
            } catch (e) { try { el.click(); } catch (e2) {} }
        }

        // AngularJS input set: native value + input/change event (ng-model bind tetiklemesi)
        function _setNgVal(input, val) {
            try {
                const proto = Object.getPrototypeOf(input);
                const setter = Object.getOwnPropertyDescriptor(proto, 'value') && Object.getOwnPropertyDescriptor(proto, 'value').set;
                if (setter) setter.call(input, val);
                else input.value = val;
            } catch (e) { input.value = val; }
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // IST2/Summary mantığı: text eşleşen ilk görünür eleman → tıkla
        function _clickByText(text) {
            const all = [
                ...document.querySelectorAll('[ng-click]'),
                ...document.querySelectorAll('a'),
                ...document.querySelectorAll('button'),
                ...document.querySelectorAll('li'),
                ...document.querySelectorAll('span')
            ];
            for (const el of all) {
                if ((el.textContent || '').trim() !== text) continue;
                if (el.offsetParent === null) continue;
                _fireClick(el);
                return el;
            }
            return null;
        }

        function _loadQueue() {
            let raw = null;
            try { raw = GM_getValue('cpt_assign_moves_v1', null); } catch (e) {}
            if (raw == null || raw === '') {
                try { raw = localStorage.getItem('cpt_assign_moves_v1'); } catch (e) {}
            }
            if (!raw) return [];
            try {
                const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
                return obj.moves || [];
            } catch (e) { return []; }
        }
        function _clearQueue() {
            try { GM_setValue('cpt_assign_moves_v1', ''); } catch (e) {}
            try { localStorage.setItem('cpt_assign_moves_v1', JSON.stringify({moves:[], ts:Date.now()})); } catch (e) {}
        }

        // Picker seçimi: filter input'a login yaz, listede beliren <a>'yı tıkla
        async function _selectPicker(login) {
            const want = String(login).toLowerCase().trim();
            const filter = document.querySelector('#pickerSelector input[ng-model="$parent.activePickerFilter"]');
            if (filter) { _setNgVal(filter, login); await _sleep(280); }
            for (let attempt = 0; attempt < 4; attempt++) {
                const links = document.querySelectorAll('#pickerSelector ul.list-unstyled li[ng-repeat*="activePicker"] a');
                for (const a of links) {
                    const txt = (a.textContent || '').toLowerCase();
                    if (txt.includes('(' + want + '@)') || txt.includes('(' + want + ')')) {
                        _fireClick(a);
                        await _sleep(150);
                        if (filter) { _setNgVal(filter, ''); await _sleep(80); }
                        return true;
                    }
                }
                await _sleep(200);
            }
            if (filter) { _setNgVal(filter, ''); }
            return false;
        }

        // Bütün seçili picker'ları temizle (önceki picker'ı çıkar)
        function _deselectAllPickers() {
            try {
                const b = document.querySelector('#pickerSelector button.btn-danger[ng-click*="deselectAllPickers"]');
                if (b && getComputedStyle(b).display !== 'none') _fireClick(b);
            } catch (e) {}
        }

        // "Remove All Eligibilities" — seçili picker'ın mevcut eligibility'lerini silmek üzere işaretler
        async function _removeAllExistingEligs() {
            for (let i = 0; i < 10; i++) {
                const b = document.querySelector('button[ng-click="removeAllPickersEligibilities()"]');
                if (b && getComputedStyle(b).display !== 'none') {
                    _fireClick(b);
                    await _sleep(220);
                    return true;
                }
                await _sleep(180);
            }
            return false;
        }

        // Eligibility (path veya cluster) ekle — Add tarafındaki listede arar
        async function _addEligibility(name) {
            const want = String(name).trim().toLowerCase();
            const page = _eligPageNow();
            const filter = page === 'cluster'
                ? (document.querySelector('input[ng-model="$parent.clusterFilter"]')
                   || document.querySelector('input[ng-model="$parent.eligibilityFilter"]'))
                : (document.querySelector('input[ng-model="$parent.eligibilityFilter"]')
                   || document.querySelector('input[ng-model="$parent.clusterFilter"]'));
            if (filter) { _setNgVal(filter, name); await _sleep(240); }
            for (let attempt = 0; attempt < 5; attempt++) {
                const links = document.querySelectorAll(
                    'ul.list-unstyled li[ng-repeat*="unselectedEligibilities"] a, '
                    + 'ul.list-unstyled li[ng-repeat*="unselectedClusters"] a'
                );
                for (const a of links) {
                    if ((a.textContent || '').trim().toLowerCase() === want) {
                        _fireClick(a);
                        await _sleep(140);
                        if (filter) { _setNgVal(filter, ''); await _sleep(80); }
                        return true;
                    }
                }
                await _sleep(200);
            }
            if (filter) { _setNgVal(filter, ''); }
            return false;
        }

        // Update butonunu bul ve tıkla — "Update" / "Update selected eligibilities" / ng-click="update..."
        async function _clickUpdate() {
            for (let i = 0; i < 12; i++) {
                // 1) Önce ng-click attribute'una göre dene (en güvenilir — AngularJS handler)
                const ngBtns = document.querySelectorAll(
                    'button[ng-click*="updateEligibilities"], '
                    + 'button[ng-click*="updatePickerEligibilities"], '
                    + 'button[ng-click*="updateClusterEligibilities"], '
                    + 'button[ng-click*="updateSelected"], '
                    + 'button[ng-click*="update"]'
                );
                for (const b of ngBtns) {
                    if (b.disabled) continue;
                    if (b.offsetParent === null) continue;
                    _fireClick(b);
                    dlog('  🖱️ Update tıklandı (ng-click: ' + (b.getAttribute('ng-click')||'') + ')');
                    return true;
                }
                // 2) Metin bazlı arama — exact veya başında "Update" geçen
                const btns = document.querySelectorAll('button, input[type="submit"]');
                for (const b of btns) {
                    if (b.disabled) continue;
                    if (b.offsetParent === null) continue;
                    const t = (b.textContent || b.value || '').trim();
                    if (!t) continue;
                    // Tam eşleşme veya "Update..." ile başlayan
                    if (t === 'Update' || t === 'Apply' || t === 'Save'
                        || /^update\s/i.test(t)
                        || /update\s+selected/i.test(t)
                        || /update\s+eligibil/i.test(t)) {
                        _fireClick(b);
                        dlog('  🖱️ Update tıklandı (text: "' + t + '")');
                        return true;
                    }
                }
                await _sleep(250);
            }
            return false;
        }

        // Picker selector görünür mü?
        function _pickerSelectorReady() {
            const sel = document.querySelector('#pickerSelector');
            return !!(sel && sel.offsetParent !== null);
        }
        async function _waitForPickerSelector(maxMs) {
            const t0 = Date.now();
            while (Date.now() - t0 < (maxMs || 10000)) {
                if (_pickerSelectorReady()) return true;
                await _sleep(300);
            }
            return false;
        }

        // ─── State machine ───
        let _running = false;        // şu anda akış işliyor
        let _stage = '';             // '' | 'picker' | 'cluster' | 'done'
        const _STAGE_KEY = 'cpt_asg_v2_stage';
        try { _stage = GM_getValue(_STAGE_KEY, '') || ''; } catch(e) {}

        function _setStage(s) {
            _stage = s;
            try { GM_setValue(_STAGE_KEY, s); } catch(e) {}
        }

        // v11.47: Her path için EXTRA eligibility'ler (AND set'i — Picker Atama ATAMACI ile aynı).
        //   DefaultPicking      → + HotpickPicking + NonMoveablePicker
        //   SingleNoSLAMPicking → + HOVPicking + NonMoveablePicker
        //   SingleMediumPicking → + HOVPicking + NonMoveablePicker
        // Picker Atama tarafında sayım bu setin TAMAMINI arıyor; ekleme de aynısını yapmalı.
        const _EXTRA_ELIGS = {
            'DefaultPicking':      ['HotpickPicking', 'NonMoveablePicker'],
            'SingleNoSLAMPicking': ['HOVPicking',     'NonMoveablePicker'],
            'SingleMediumPicking': ['HOVPicking',     'NonMoveablePicker']
        };

        async function _runPickerStage(moves) {
            // v11.49: TOPLU MOD — pickerları hedef path'e göre grupla, her grupta toplu seçim + tek Update.
            //   Mevcut path zaten doğruysa skip (move.pathChanged === false → atla)
            const ok = await _waitForPickerSelector(15000);
            if (!ok) { dlog('⚠ [asg] picker-eligibilities pickerSelector gelmedi'); return false; }
            await _sleep(800);

            // 1) Sadece path değişimi gereken pickerları filtrele
            const pathMoves = moves.filter(m => m.pathChanged !== false && (m.paths||[]).length > 0);
            const skippedPathOk = moves.length - pathMoves.length;
            if (skippedPathOk > 0) {
                dlog('  ⏭ Path zaten doğru: ' + skippedPathOk + ' picker atlandı');
            }

            if (!pathMoves.length) {
                dlog('🟩 [asg] Path değişimi gereken picker yok — cluster aşamasına geçilebilir');
                return true;
            }

            // 2) Hedef path'e göre grupla — her grup için TEK Update
            const groupsByPath = {};
            pathMoves.forEach(m => {
                (m.paths||[]).forEach(pp => {
                    if (!groupsByPath[pp]) groupsByPath[pp] = [];
                    groupsByPath[pp].push(m);
                });
            });

            dlog('🟩 [asg] Path aşaması — ' + Object.keys(groupsByPath).length + ' grup, toplam ' + pathMoves.length + ' picker');

            // 3) Her path grubu için: tüm pickerları seç → tek Update
            for (const [pp, groupMoves] of Object.entries(groupsByPath)) {
                const main = _ppToElig(pp);
                if (!main) { dlog('  ⚠ Bilinmeyen path: ' + pp); continue; }
                // AND set'i — main + EXTRA'lar + NonMoveablePicker
                const eligsToAdd = new Set([main]);
                (_EXTRA_ELIGS[main] || []).forEach(x => eligsToAdd.add(x));
                eligsToAdd.add('NonMoveablePicker');

                dlog('  📦 [' + pp + '] ' + groupMoves.length + ' picker → ' + [...eligsToAdd].join(', '));

                // Önce TÜM seçimleri temizle
                _deselectAllPickers();
                await _sleep(400);

                // Tüm pickerları seç (ardışık olarak filter + click → seçim birikir)
                let selectedCount = 0;
                for (const move of groupMoves) {
                    const sel = await _selectPicker(move.login);
                    if (sel) selectedCount++;
                    else dlog('    ⚠ ' + move.login + ' picker listede yok — atlandı');
                    await _sleep(180);
                }

                if (!selectedCount) {
                    dlog('  ⚠ [' + pp + '] hiçbir picker seçilemedi — atlandı');
                    continue;
                }
                dlog('  ✓ ' + selectedCount + '/' + groupMoves.length + ' picker seçildi');
                await _sleep(400);

                // Eski eligibility'leri toplu sil
                await _removeAllExistingEligs();
                await _sleep(300);

                // Yeni eligibility'leri ekle
                for (const eligName of eligsToAdd) {
                    const added = await _addEligibility(eligName);
                    if (!added) dlog('    ⚠ ' + eligName + ' eklenemedi');
                    await _sleep(200);
                }
                await _sleep(300);

                // Tek Update — tüm seçili pickerlara uygulanır
                const upd = await _clickUpdate();
                if (!upd) { dlog('  ⚠ [' + pp + '] Update bulunamadı'); return false; }
                dlog('  ✅ [' + pp + '] Update tıklandı — ' + selectedCount + ' picker güncellendi');

                // Update sonrası bekle
                await _sleep(2000);
                await _waitForPickerSelector(10000);
                await _sleep(500);
            }
            return true;
        }

        async function _runClusterStage(moves) {
            // v11.49: TOPLU MOD — pickerları hedef kata göre grupla, her grupta toplu seçim + tek Update.
            //   Mevcut kat zaten doğruysa skip (move.katChanged === false → atla)
            const ok = await _waitForPickerSelector(15000);
            if (!ok) { dlog('⚠ [asg] cluster-eligibilities pickerSelector gelmedi'); return false; }
            await _sleep(800);

            // 1) Sadece kat değişimi gereken pickerları filtrele
            const katMoves = moves.filter(m => m.katChanged !== false && m.toGrp && _GRP_CLUSTERS[m.toGrp]);
            const skippedKatOk = moves.length - katMoves.length;
            if (skippedKatOk > 0) {
                dlog('  ⏭ Kat zaten doğru veya bilinmeyen: ' + skippedKatOk + ' picker atlandı');
            }

            if (!katMoves.length) {
                dlog('🟦 [asg] Kat değişimi gereken picker yok');
                return true;
            }

            // 2) Hedef kata göre grupla
            const groupsByGrp = {};
            katMoves.forEach(m => {
                if (!groupsByGrp[m.toGrp]) groupsByGrp[m.toGrp] = [];
                groupsByGrp[m.toGrp].push(m);
            });

            dlog('🟦 [asg] Cluster aşaması — ' + Object.keys(groupsByGrp).length + ' grup, toplam ' + katMoves.length + ' picker');

            // 3) Her hedef kat grubu için: tüm pickerları seç → tek Update
            for (const [toGrp, groupMoves] of Object.entries(groupsByGrp)) {
                const clusters = _GRP_CLUSTERS[toGrp];
                if (!clusters) { dlog('  ⚠ Bilinmeyen toGrp: ' + toGrp); continue; }

                dlog('  📦 [→' + toGrp + '] ' + groupMoves.length + ' picker → clusters: ' + clusters.join(', '));

                _deselectAllPickers();
                await _sleep(400);

                let selectedCount = 0;
                for (const move of groupMoves) {
                    const sel = await _selectPicker(move.login);
                    if (sel) selectedCount++;
                    else dlog('    ⚠ ' + move.login + ' picker listede yok — atlandı');
                    await _sleep(180);
                }

                if (!selectedCount) {
                    dlog('  ⚠ [→' + toGrp + '] hiçbir picker seçilemedi — atlandı');
                    continue;
                }
                dlog('  ✓ ' + selectedCount + '/' + groupMoves.length + ' picker seçildi');
                await _sleep(400);

                await _removeAllExistingEligs();
                await _sleep(300);

                for (const cl of clusters) {
                    const added = await _addEligibility(cl);
                    if (!added) dlog('    ⚠ ' + cl + ' eklenemedi');
                    await _sleep(200);
                }
                await _sleep(300);

                const upd = await _clickUpdate();
                if (!upd) { dlog('  ⚠ [→' + toGrp + '] Update bulunamadı'); return false; }
                dlog('  ✅ [→' + toGrp + '] Update tıklandı — ' + selectedCount + ' picker güncellendi');

                await _sleep(2000);
                await _waitForPickerSelector(10000);
                await _sleep(500);
            }
            return true;
        }

        async function _tickAsg() {
            if (_running) return;
            const moves = _loadQueue();
            if (!moves.length) {
                // Queue boş; eğer stage 'done' ise temizle
                if (_stage) _setStage('');
                return;
            }
            const page = _eligPageNow();

            // Aşamayı belirle
            if (!_stage) {
                if (page !== 'summary' && page !== 'picker' && page !== 'cluster') return;
                _setStage('picker');
                dlog('🚀 [asg] Akış başlıyor — ' + moves.length + ' picker. Stage=picker');
            }

            if (_stage === 'picker') {
                if (page === 'picker') {
                    _running = true;
                    try {
                        const ok = await _runPickerStage(moves);
                        if (ok) {
                            _setStage('cluster');
                            dlog('➡️ [asg] Picker tamamlandı → Cluster Eligibilities\'e geçiliyor');
                            _clickByText('Cluster Eligibilities');
                        }
                    } finally { _running = false; }
                } else {
                    // Picker sayfasında değiliz → linke tıkla
                    _clickByText('Picker Eligibilities');
                }
                return;
            }

            if (_stage === 'cluster') {
                if (page === 'cluster') {
                    _running = true;
                    try {
                        const ok = await _runClusterStage(moves);
                        if (ok) {
                            _setStage('done');
                            dlog('➡️ [asg] Cluster tamamlandı → Summary\'ye dönülüyor + queue temizleniyor');
                            _clickByText('Summary');
                            await _sleep(800);
                            _clearQueue();
                            _setStage('');
                        }
                    } finally { _running = false; }
                } else {
                    _clickByText('Cluster Eligibilities');
                }
                return;
            }
        }

        // Tick interval — 2 saniyede bir, ama _running flag ile reentrancy yok
        setInterval(() => { _tickAsg().catch(e => dlog('❌ [asg] tick error: ' + e.message)); }, 2000);

        // Eski stage 'done' kaldıysa temizle (önceki seans bitmiş olabilir)
        if (_stage === 'done') _setStage('');

        dlog('🟢 [asg] Atama otomasyonu kuruldu (stage=' + (_stage||'(boş)') + ')');
    })();


    function pushEligibility() {
        if (!IS_ELIG_SUMMARY_now()) return;  // v11.15: alt sayfalarda scrape yok
        try {
            // "Number of Active Pickers: N" — filtreden bağımsız gerçek toplam
            let activeTotal = 0;
            try {
                const m = (document.body.textContent || '').match(/Number of Active Pickers\s*:?\s*(\d+)/i);
                if (m) activeTotal = parseInt(m[1]) || 0;
            } catch (e) {}

            // Picker satırları
            let rows = document.querySelectorAll('tr[ng-repeat*="pickerDashboardInfo"]');
            if (!rows.length) rows = document.querySelectorAll('tbody tr.ng-scope');
            if (!rows.length) return;

            const counts = {};
            const byCluster = {};     // v11.05: { "P5": {DefaultPicking:N, SingleNoSLAMPicking:M, ...}, ... }
            const clusterTotal = {};  // v11.05: { "P5": o cluster'daki picker sayısı }
            const floorBreak = {};    // v11.12: { path: { pairs:{"P1-2":n,"P3-4":n,"P5-6":n}, singles:{kat:n} } }
            const floorBreakAnd = {}; // v11.46: { kategori: aynı şekil } — AND mantığı ile (zorunlu eligibility seti)
            const pickerEligs = {};   // v11.48: { login: { paths:[...], floors:[...] } } — otomatik atama için
            const PAIRS = [[1,2],[3,4],[5,6]];
            let total = 0;
            rows.forEach(tr => {
                const tds = tr.querySelectorAll('td');
                if (tds.length < 5) return;
                // v11.48: Login'i al — ilk td'de "/picker/LOGIN" linki olur
                let _login = '';
                try {
                    const a = tr.querySelector('a[href*="/picker/"]');
                    if (a) {
                        const m = (a.getAttribute('href')||'').match(/\/picker\/([^/?]+)/);
                        if (m) _login = m[1].toLowerCase();
                    }
                } catch(e) {}
                // v11.11: TÜM satırı tara. Path'ler "Picker Eligibilities" hücresinde,
                // kat (cluster) değerleri AYRI "Cluster Eligibilities" hücresinde — ikisi de .eligibility-box span.
                // v11.44: .eligibility-box span yetersizse .eligibility-box'ın kendi childNode'larını da topla
                //         (text node'lar veya başka inline elementler içinde Joint_P1&2 olabiliyor).
                let nodes = [...tr.querySelectorAll('.eligibility-box span')];
                // span yok veya az → .eligibility-box içindeki tüm text fragmentlarını da ekle
                if (nodes.length < 3) {
                    const boxes = tr.querySelectorAll('.eligibility-box');
                    boxes.forEach(box => {
                        // Box içinde direkt span yoksa, badge/label türü her şeyi yakala
                        const extras = box.querySelectorAll('span, label, .label, .badge, a, div');
                        extras.forEach(e => {
                            // Sadece YAPRAK elementler (içinde başka eligibility item olmayan) — duplicate önle
                            if (!e.querySelector('span, label, .label, .badge')) nodes.push(e);
                        });
                        // Hâlâ boşsa box'un kendisi
                        if (!extras.length) nodes.push(box);
                    });
                }
                if (!nodes.length) return;
                const paths = new Set();
                const floors = new Set();   // {1,2,...,6}
                // v11.44: debug için — bilinmeyen token'ları topla (sadece bir kere logla)
                if (!window._cptEligUnknownTokens) window._cptEligUnknownTokens = new Set();
                nodes.forEach(n => {
                    const txt = (n.textContent || '').trim();
                    if (!txt) return;
                    if (/Picking$|Picker$/i.test(txt)) { paths.add(txt); return; }
                    let m = txt.match(/^[Pp](\d+)All$/);                     // p3All / P6All → kat 3 / 6
                    if (m) { floors.add(parseInt(m[1])); return; }
                    // v11.44: Joint regex daha tolerant — "P2" / "2" / boşluk farkı / & yerine "and"
                    let j = txt.match(/^Joint[_\s]*P?(\d+)\s*(?:&|and|\+)\s*P?(\d+)$/i);
                    if (j) { floors.add(parseInt(j[1])); floors.add(parseInt(j[2])); return; }
                    // 3'lü/4'lü joint olabilir (Joint_P1&2&3 gibi)
                    let j3 = txt.match(/^Joint[_\s]*P?(\d+)\s*(?:&|and|\+)\s*P?(\d+)\s*(?:&|and|\+)\s*P?(\d+)$/i);
                    if (j3) {
                        floors.add(parseInt(j3[1]));
                        floors.add(parseInt(j3[2]));
                        floors.add(parseInt(j3[3]));
                        return;
                    }
                    // HRV gibi label'ları sayma, ama bilinmeyenleri logla
                    if (txt.length < 40 && !/^(HRV|NonHRV|SLAM|NonSLAM)$/i.test(txt) && !window._cptEligUnknownTokens.has(txt)) {
                        window._cptEligUnknownTokens.add(txt);
                        // Sadece ilk 10 farklı token'ı logla, spam olmasın
                        if (window._cptEligUnknownTokens.size <= 10) {
                            dlog('🔍 [elig] tanımlanamayan token: "' + txt + '"');
                        }
                    }
                });
                // toplam path sayımı (mevcut davranış korunur)
                paths.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
                // kat × path kırılımı: her (kat, path) çifti için say → byCluster["P1"]["DefaultPicking"] = Multi kat1 sayısı
                floors.forEach(f => {
                    const cl = 'P' + f;
                    clusterTotal[cl] = (clusterTotal[cl] || 0) + 1;
                    if (!byCluster[cl]) byCluster[cl] = {};
                    paths.forEach(p => { byCluster[cl][p] = (byCluster[cl][p] || 0) + 1; });
                });
                // v11.12: kat ÇİFTİ bazında (P1-2/P3-4/P5-6) — her iki katı da olan picker çift sayılır;
                //         çiftin sadece bir katı olan picker "tek" olarak ayrı sayılır.
                paths.forEach(p => {
                    if (!floorBreak[p]) floorBreak[p] = { pairs: {}, singles: {} };
                    const fb = floorBreak[p]; const used = new Set();
                    PAIRS.forEach(pr => {
                        const a = pr[0], b = pr[1], key = 'P' + a + '-' + b;
                        const hasA = floors.has(a), hasB = floors.has(b);
                        if (hasA && hasB) { fb.pairs[key] = (fb.pairs[key] || 0) + 1; used.add(a); used.add(b); }
                        else if (hasA) { fb.singles[a] = (fb.singles[a] || 0) + 1; used.add(a); }
                        else if (hasB) { fb.singles[b] = (fb.singles[b] || 0) + 1; used.add(b); }
                    });
                    floors.forEach(f => { if (!used.has(f)) fb.singles[f] = (fb.singles[f] || 0) + 1; });
                });

                // v11.46: AND mantığı için floorBreakAnd — path "kategorileri" için zorunlu eligibility seti.
                //   DefaultPicking      → DefaultPicking + HotpickPicking + NonMoveablePicker (HEPSİ olmalı)
                //   SingleNoSLAMPicking → SingleNoSLAMPicking + HOVPicking + NonMoveablePicker (HEPSİ olmalı)
                //   SingleMediumPicking → SingleMediumPicking + HOVPicking + NonMoveablePicker (HEPSİ olmalı)
                // Picker BU SETİN tamamına sahipse kategoride sayılır; eksikse sayılmaz.
                const _AND_SETS = {
                    'DefaultPicking':      ['DefaultPicking', 'HotpickPicking', 'NonMoveablePicker'],
                    'SingleNoSLAMPicking': ['SingleNoSLAMPicking', 'HOVPicking', 'NonMoveablePicker'],
                    'SingleMediumPicking': ['SingleMediumPicking', 'HOVPicking', 'NonMoveablePicker']
                };
                Object.entries(_AND_SETS).forEach(([cat, requiredSet]) => {
                    // Picker bu kategori için "tam yetkili" mi? (tüm zorunlu eligibility'lere sahip mi?)
                    const ok = requiredSet.every(req => paths.has(req));
                    if (!ok) return;
                    if (!floorBreakAnd[cat]) floorBreakAnd[cat] = { pairs: {}, singles: {} };
                    const fb = floorBreakAnd[cat]; const used = new Set();
                    PAIRS.forEach(pr => {
                        const a = pr[0], b = pr[1], key = 'P' + a + '-' + b;
                        const hasA = floors.has(a), hasB = floors.has(b);
                        if (hasA && hasB) { fb.pairs[key] = (fb.pairs[key] || 0) + 1; used.add(a); used.add(b); }
                        else if (hasA) { fb.singles[a] = (fb.singles[a] || 0) + 1; used.add(a); }
                        else if (hasB) { fb.singles[b] = (fb.singles[b] || 0) + 1; used.add(b); }
                    });
                    floors.forEach(f => { if (!used.has(f)) fb.singles[f] = (fb.singles[f] || 0) + 1; });
                });
                // v11.48: Picker bazlı yetki seti (otomatik atama için)
                if (_login) {
                    pickerEligs[_login] = {
                        paths: [...paths],
                        floors: [...floors]
                    };
                }
                total++;
            });

            if (!total) return;

            // Filtre guard: kullanıcı arama kutusuna yazıp tabloyu filtrelediyse
            // görünen satır sayısı gerçek toplamdan çok azdır → cache'i bozma, atla.
            if (activeTotal && total < activeTotal * 0.6) {
                dlog('⏸ Eligibility: tablo filtreli görünüyor (' + total + '/' + activeTotal + '), atlandı');
                return;
            }

            push('cpt_eligibility_v1', { counts, byCluster, clusterTotal, floorBreak, floorBreakAnd, pickerEligs, total: activeTotal || total, rows: total, ts: Date.now() });
            var _mf = [1,2,3,4,5,6].map(function(f){ var c = byCluster['P'+f]; return 'P'+f+'='+((c && c['DefaultPicking']) || 0); }).join(' ');
            dlog('📋 Eligibility: ' + total + ' picker · NoSLAM=' + (counts['SingleNoSLAMPicking'] || 0) +
                 ' Default=' + (counts['DefaultPicking'] || 0) + ' SingleMedium=' + (counts['SingleMediumPicking'] || 0) +
                 ' · Multi kat → ' + _mf);
        } catch (e) { dlog('Eligibility scrape hata: ' + String(e).substring(0, 80)); }
    }

    // v11.23: setInterval/MutationObserver HER ZAMAN kurulur; pushEligibility içinde
    // dinamik summary guard'ı (IS_ELIG_SUMMARY_now) var — alt sayfada erken return eder.
    // SPA'da summary'e sonradan geçilse de scrape devreye girer.
    setTimeout(pushEligibility, 1200);
    setInterval(pushEligibility, 5000);
    setTimeout(() => {
        try {
            const tgt = document.querySelector('table') || document.body;
            const o = new MutationObserver(() => { clearTimeout(window._eligT); window._eligT = setTimeout(pushEligibility, 400); });
            o.observe(tgt, { childList: true, subtree: true });
        } catch (e) {}
    }, 1500);

    // 60sn'de bir otomatik yenileme (yazarken ertelenir) — sayılar canlı kalsın
    // v11.15: Sadece summary'de; alt sayfalarda kullanıcı seçimi var, reload yok.
    let _eligReload = Date.now();
    setInterval(() => {
        try {
            if (!IS_ELIG_SUMMARY_now()) return;
            if (Date.now() - _eligReload < 60000) return;
            const ae = document.activeElement;
            if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
            _eligReload = Date.now();
            dlog('🔄 FC Eligibility otomatik yenileme (60sn)');
            location.reload();
        } catch (e) {}
    }, 10000);

    // Dashboard merkezi "Yenile" / oto-yenileme (what='all') → bu sayfayı da yenile.
    // Sinyal GM storage'dan gelir (file:// köprüsü cpt_force_fetch_gm'e yazar).
    // Manuel basış (force) → hemen reload; oto-yenileme → 60sn dolduysa (churn olmasın).
    // Reload sonrası aynı sinyali tekrar işlememek için son görülen ts localStorage'da saklanır
    // (reload döngüsünü engeller). Kullanıcı arama kutusunda yazıyorsa reload ertelenir.
    const ELIG_SEEN_KEY = 'cpt_elig_ff_seen';
    setInterval(() => {
        try {
            if (!IS_ELIG_SUMMARY_now()) return;  // v11.15: alt sayfalarda merkezi reload da yok
            let req = null;
            try { const gm = GM_getValue('cpt_force_fetch_gm', null); if (gm && gm.ts) req = gm; } catch (e) {}
            if (!req) { try { const raw = localStorage.getItem('cpt_force_fetch'); if (raw) req = JSON.parse(raw); } catch (e) {} }
            if (!req || !req.ts) return;
            if (req.what !== 'all' && req.what !== 'eligibility' && req.what !== 'eligibility-reload') return;
            let lastSeen = 0;
            try { lastSeen = parseInt(localStorage.getItem(ELIG_SEEN_KEY) || '0'); } catch (e) {}
            if (req.ts <= lastSeen) return;            // bu sinyal zaten işlendi (reload döngüsü koruması)
            if (Date.now() - req.ts > 30000) return;   // eski sinyal, geç
            const manual = !!req.force;
            if (!manual && (Date.now() - _eligReload < 60000)) {  // oto sinyal + 60sn dolmadı → atla
                try { localStorage.setItem(ELIG_SEEN_KEY, String(req.ts)); } catch (e) {}
                return;
            }
            try { localStorage.setItem(ELIG_SEEN_KEY, String(req.ts)); } catch (e) {}
            const ae = document.activeElement;
            if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) {
                dlog('⏸ FC Eligibility: Yenile sinyali geldi ama arama yapılıyor, reload ertelendi');
                return;   // sinyal tüketildi; aramayı bozma
            }
            _eligReload = Date.now();
            dlog('🔔 FC Eligibility: merkezi Yenile sinyali (' + req.what + (manual ? ', manuel' : '') + ') → reload');
            try { pushEligibility(); } catch (e) {}
            setTimeout(() => { try { location.reload(); } catch (e) {} }, 150);
        } catch (e) {}
    }, 500);

    try {
        if (typeof GM_registerMenuCommand === 'function') GM_registerMenuCommand('📋 Eligibility say (manuel)', pushEligibility);
    } catch (e) {}

    dlog('📋 FC Eligibility sayıcı hazır — tablo açıkken 5sn sayım, 60sn yenileme');
    return;
}

if(!IS_PICKING && !IS_RODEO) return;

// ════════════════════════════════════════════════════════
//  SCORECARD — günlük rate verisi
// ════════════════════════════════════════════════════════
if (IS_SCORECARD && !IS_IFRAME) {   // v12.47: iframe'de bu blok çalışmaz (sonsuz reload/çift-çekim önlenir; ayar orkestratöre bırakılır)
    let _searched = false;
    let _lastShiftKey = '';



    // Cloudscape sayfası JSON API çağrıları yapıyor. Bu çağrıları yakalayıp:
    // 1) URL pattern'lerini GM storage'a kaydedelim (workforce sayfası kullanabilsin)
    // 2) JSON response'larını direkt parse edip cache'e yazalım (DOM scrape'den ÇOK daha hızlı)
    (function setupApiInterceptor() {
        const captureResponse = (url, responseText, source) => {
            try {
                if (!url || typeof url !== 'string') return;
                // Sadece scorecard ile ilgili API'leri yakala
                if (!/scorecard|picker.*performance|reports/i.test(url)) return;
                // JSON mu?
                if (!responseText || responseText.trim()[0] !== '{') {
                    // HTML olabilir, atla
                    return;
                }
                const data = JSON.parse(responseText);
                // Cloudscape genelde "items" veya "scorecards" array'i döndürür
                let items = null;
                if (Array.isArray(data)) items = data;
                else if (Array.isArray(data.items)) items = data.items;
                else if (Array.isArray(data.scorecards)) items = data.scorecards;
                else if (Array.isArray(data.results)) items = data.results;
                else if (Array.isArray(data.data)) items = data.data;
                else {
                    // Belki nested? Recursive ilk array'i bul
                    for (const k of Object.keys(data)) {
                        if (Array.isArray(data[k]) && data[k].length > 0
                            && typeof data[k][0] === 'object'
                            && (data[k][0].login || data[k][0].userId || data[k][0].picker)) {
                            items = data[k];
                            break;
                        }
                    }
                }
                if (!items || !items.length) return;

                console.log('[CPT10 api]', source, 'captured', items.length, 'items from', url.substring(0, 80));

                // URL pattern'i sakla (gelecekte programatik çağırmak için)
                // v11.26: Bu URL kaydedilince workforce sekmesi scorecard'ı 30 gün tek başına çekebilir.
                try {
                    const prev = GM_getValue('cpt_scorecard_api_url', null);
                    GM_setValue('cpt_scorecard_api_url', { url, ts: Date.now() });
                    if (!prev || !prev.url) {
                        dlog('✅ Scorecard API URL KAYDEDİLDİ — artık workforce sekmesi scorecard\'ı tek başına çekebilir (30 gün)');
                        console.log('[CPT11.26] ✅ Scorecard API URL kaydedildi — tek-sekme modu için hazır');
                    }
                } catch(e) {}

                // Items'ları parse et — Cloudscape field isimleri (kontrol et)
                const parsed = {};
                items.forEach(item => {
                    const login = (item.login || item.userId || item.user_id || item.picker || '').toLowerCase();
                    if (!login || login.length < 3) return;
                    parsed[login] = {
                        login,
                        picks:  parseInt(item.quantityPicked || item.picks || 0) || 0,
                        actDT:  item.actualDirectTime || item.actualTime || '',
                        expDT:  item.expectedDirectTime || item.expectedTime || '',
                        pctDT:  parseFloat(item.perDirectTime || item.percentToDirectTime || 0) || 0,
                        dpr:    parseInt(item.directPickRate || item.pickRate || 0) || 0,
                        expPR:  parseInt(item.expectedPickRate || 0) || 0,
                        ts:     Date.now()
                    };
                });

                if (Object.keys(parsed).length) {
                    console.log('[CPT10 api] parsed', Object.keys(parsed).length, 'pickers from JSON, writing to cache');
                    // URL'den filtre bilgilerini çıkar (fromTime, toTime)
                    const fromTime = (url.match(/fromTime=([^&]+)/) || [])[1];
                    const toTime   = (url.match(/toTime=([^&]+)/) || [])[1];
                    // SHIFT vs FULL-DAY ayrımı
                    const isFullDayUrl = (!fromTime && !toTime) ||
                                         (decodeURIComponent(fromTime||'') === '00:00' &&
                                          (decodeURIComponent(toTime||'') === '23:59' || decodeURIComponent(toTime||'') === '24:00'));
                    if (isFullDayUrl) {
                        push('cpt_scorecard_v9', { data: parsed, ts: Date.now() });
                    } else if (fromTime && toTime) {
                        const resp = {
                            data: parsed,
                            fromTime: decodeURIComponent(fromTime),
                            toTime: decodeURIComponent(toTime),
                            ts: Date.now()
                        };
                        try { GM_setValue('cpt_shift_scorecard_gm', resp); } catch(e){}
                        push('cpt_shift_scorecard', resp);
                    }
                }
            } catch(e) {
                console.log('[CPT10 api] capture error:', e.message);
            }
        };

        // 1) fetch() intercept
        const origFetch = window.fetch;
        window.fetch = function(...args) {
            return origFetch.apply(this, args).then(resp => {
                const url = (typeof args[0] === 'string') ? args[0] : args[0].url;
                if (url && /scorecard|reports|picker.*performance/i.test(url)) {
                    // Response'u clone et (orijinal akışı bozmayalım)
                    resp.clone().text().then(txt => captureResponse(url, txt, 'fetch')).catch(()=>{});
                }
                return resp;
            });
        };

        // 2) XMLHttpRequest intercept
        const origXHROpen = XMLHttpRequest.prototype.open;
        const origXHRSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this._cptUrl = url;
            return origXHROpen.call(this, method, url, ...rest);
        };
        XMLHttpRequest.prototype.send = function(...args) {
            this.addEventListener('load', () => {
                if (this._cptUrl && /scorecard|reports|picker.*performance/i.test(this._cptUrl)) {
                    try { captureResponse(this._cptUrl, this.responseText, 'xhr'); } catch(e) {}
                }
            });
            return origXHRSend.apply(this, args);
        };

        console.log('[CPT10 scorecard] API interceptor installed (fetch + XHR)');
    })();

    // Input'a değer set et (React-aware)
    function setInput(el, val) {
        if(!el) return;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
        setter.call(el, val);
        const fk = Object.keys(el).find(k=>k.startsWith('__reactFiber')||k.startsWith('__reactInternalInstance'));
        if(fk) {
            let f=el[fk];
            while(f){const h=f.memoizedProps&&(f.memoizedProps.onChange||f.memoizedProps.onInput);if(h){try{h({target:el,currentTarget:el,type:'change'});}catch(e){}break;}f=f.return;}
        }
        ['input','change','blur'].forEach(ev=>el.dispatchEvent(new Event(ev,{bubbles:true})));
    }

    function clickSearch(delay) {
        setTimeout(() => {
            const btn = [...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Search');
            if(btn) { btn.click(); console.log('[CPT10 scorecard] Search clicked'); }
        }, delay||400);
    }

    // Pick Processes multiselect'i doldur (Cloudscape React component)
    // Birden fazla strateji ile dener — log'lar ne çalışıp ne çalışmadığını anlatır.
    async function setPickProcesses(processes) {
        const TAG = '[CPT10 multiselect]';
        if (!Array.isArray(processes) || !processes.length) {
            console.log(TAG, 'no processes, skipping');
            return;
        }
        console.log(TAG, '═══ START ═══ wanted:', processes);

        // ─── 1) Multiselect trigger butonunu bul ───
        // Strateji 1: aria-haspopup="listbox" + içinde "Pick Process" geçen button
        // Strateji 2: "select Pick Processes" placeholder'lı span'ın parent button'ı
        // Strateji 3: "Pick Processes" label'ı olan formfield'in altındaki button
        let trigger = null;
        const debugBtns = [];

        // Strateji 1
        const allTriggers = [...document.querySelectorAll('button[aria-haspopup="listbox"]')];
        console.log(TAG, `Strateji 1: ${allTriggers.length} listbox button bulundu`);
        for (const b of allTriggers) {
            const txt = (b.textContent || '').toLowerCase().slice(0, 80);
            debugBtns.push(txt);
            if (txt.includes('pick process') || txt.includes('select pick')) { trigger = b; break; }
        }
        console.log(TAG, 'listbox button textleri:', debugBtns);

        // Strateji 2: placeholder span
        if (!trigger) {
            const spans = [...document.querySelectorAll('span')]
                .filter(s => /select pick processes/i.test(s.textContent || ''));
            console.log(TAG, `Strateji 2: ${spans.length} placeholder span bulundu`);
            if (spans.length) trigger = spans[0].closest('button');
        }

        // Strateji 3: "Pick Processes" label
        if (!trigger) {
            const labels = [...document.querySelectorAll('label, [class*="label"]')]
                .filter(l => /^pick processes$/i.test((l.textContent || '').trim()));
            console.log(TAG, `Strateji 3: ${labels.length} "Pick Processes" label bulundu`);
            if (labels.length) {
                const fieldset = labels[0].closest('[class*="form-field"], [class*="formField"], div');
                if (fieldset) {
                    trigger = fieldset.querySelector('button[aria-haspopup]');
                }
            }
        }

        if (!trigger) {
            console.log(TAG, '❌ TRIGGER BULUNAMADI — sayfa hâlâ yükleniyor olabilir veya selector değişmiş');
            console.log(TAG, 'sayfadaki tüm aria-haspopup butonları:',
                [...document.querySelectorAll('button[aria-haspopup]')].map(b => ({
                    haspopup: b.getAttribute('aria-haspopup'),
                    text: (b.textContent||'').trim().slice(0, 60),
                    aria: b.getAttribute('aria-labelledby')
                })));
            return;
        }
        console.log(TAG, '✓ trigger bulundu:', (trigger.textContent||'').trim().slice(0, 80));

        // ─── 2) Dropdown'u aç ───
        if (trigger.getAttribute('aria-expanded') !== 'true') {
            console.log(TAG, 'dropdown açılıyor...');
            trigger.click();
            await new Promise(r => setTimeout(r, 600));
        } else {
            console.log(TAG, 'dropdown zaten açık');
        }

        // ─── 3) Listbox + option'ları bul ───
        let listbox = document.querySelector('[role="listbox"]');
        if (!listbox) {
            // Cloudscape bazen ul[role="listbox"] yerine div container kullanır
            listbox = document.querySelector('[class*="options-list"]')
                   || document.querySelector('[id*="option-list"]');
        }
        if (!listbox) {
            console.log(TAG, '❌ listbox BULUNAMADI dropdown açıldıktan sonra');
            console.log(TAG, 'sayfadaki role="listbox" elementleri:',
                [...document.querySelectorAll('[role]')].filter(e => e.getAttribute('role').includes('list')).length);
            return;
        }
        console.log(TAG, '✓ listbox bulundu, tag:', listbox.tagName, 'children:', listbox.children.length);

        // Option'ları al — birden fazla strateji
        let options = [...listbox.querySelectorAll('[role="option"]')];
        if (!options.length) options = [...listbox.querySelectorAll('li')];
        if (!options.length) options = [...listbox.querySelectorAll('[data-testid*="option"]')];
        if (!options.length) options = [...listbox.children];
        console.log(TAG, `${options.length} option bulundu`);

        if (!options.length) {
            console.log(TAG, '❌ option yok — listbox boş olabilir');
            return;
        }

        // Option metnini güvenli al
        const getOptionLabel = el => {
            // Önce data-test-index sonrası label class arar
            const lblEl = el.querySelector('[class*="label"], [class*="text"], span:not([class*="check"]):not([class*="icon"])');
            const raw = lblEl ? lblEl.textContent : el.textContent;
            return (raw || '').trim().replace(/\s+/g, ' ');
        };
        const isOptionSelected = el => {
            return el.getAttribute('aria-selected') === 'true'
                || el.classList.toString().includes('selected')
                || !!el.querySelector('input[type="checkbox"]:checked')
                || !!el.querySelector('[class*="checked"], [aria-checked="true"]');
        };

        console.log(TAG, 'mevcut option label\'ları:',
            options.slice(0, 35).map(o => ({
                label: getOptionLabel(o),
                selected: isOptionSelected(o)
            })));

        // ─── 4) "All"'ı kaldır ───
        const allOpt = options.find(o => getOptionLabel(o) === 'All');
        if (allOpt && isOptionSelected(allOpt)) {
            console.log(TAG, 'All seçili → kaldırılıyor');
            allOpt.click();
            await new Promise(r => setTimeout(r, 250));
        }

        // ─── 5) İstenmeyen seçili process'leri kaldır ───
        const wanted = new Set(processes);
        for (const opt of options) {
            const label = getOptionLabel(opt);
            if (!label || label === 'All') continue;
            if (isOptionSelected(opt) && !wanted.has(label)) {
                console.log(TAG, 'kaldırılıyor:', label);
                opt.click();
                await new Promise(r => setTimeout(r, 150));
            }
        }

        // ─── 6) İstenen process'leri seç ───
        for (const proc of processes) {
            const opt = options.find(o => getOptionLabel(o) === proc);
            if (!opt) {
                console.log(TAG, '⚠ option NOT found:', proc);
                continue;
            }
            if (!isOptionSelected(opt)) {
                console.log(TAG, '+ ekliyor:', proc);
                opt.click();
                await new Promise(r => setTimeout(r, 200));
            } else {
                console.log(TAG, '= zaten seçili:', proc);
            }
        }

        // ─── 7) Dropdown'u kapat (boş yere tıkla) ───
        await new Promise(r => setTimeout(r, 200));
        // Önce ESC tuşu, sonra body click
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await new Promise(r => setTimeout(r, 100));
        if (trigger.getAttribute('aria-expanded') === 'true') {
            trigger.click(); // tekrar trigger'a tıklarsak kapanır
        }
        console.log(TAG, '═══ DONE ═══');
    }

    // pushScorecard'ı geçici kilitle — Search bastıktan sonra DOM henüz güncellenmediği için
    // stale veri yazılmasını engellemek için
    window._pushScorecardLockUntil = 0;

    // Tarih + saat + process set et ve search bas
    async function setFiltersAndSearch(fromTime, toTime, processes) {
        const t = new Date();
        const today = `${t.getFullYear()}/${String(t.getMonth()+1).padStart(2,'0')}/${String(t.getDate()).padStart(2,'0')}`;

        // KİLİT: filtre değiştirme süresince ve Search sonrası 8 saniye boyunca
        // pushScorecard çağrılmasın — yoksa stale DOM (eski sonuçlar) yeni saat
        // etiketiyle cache'e yazılır
        window._pushScorecardLockUntil = Date.now() + 8000;

        // Tarih input'ları
        const dateInputs = [...document.querySelectorAll('input[placeholder="YYYY-MM-DD"]')];
        dateInputs.forEach(inp => { if(inp.value !== today) setInput(inp, today); });

        // Saat input'ları — birden fazla selector dene
        let timeInputs = [...document.querySelectorAll('input[placeholder="HH:mm"]')];
        if(!timeInputs.length) {
            timeInputs = [...document.querySelectorAll('input[type="text"]')]
                .filter(i => /^\d{2}:\d{2}$/.test(i.value) || i.placeholder==='HH:mm');
        }

        if(timeInputs.length >= 2) {
            setInput(timeInputs[0], fromTime);
            await new Promise(r => setTimeout(r, 100));
            setInput(timeInputs[1], toTime);
            console.log('[CPT10 scorecard] set time:', fromTime, '-', toTime);
        }

        // Pick Processes multiselect (varsa)
        if (Array.isArray(processes) && processes.length) {
            await new Promise(r => setTimeout(r, 200));
            await setPickProcesses(processes);
        }

        clickSearch(600);
        // Search basıldıktan sonra kilidi yenile (sayfanın yeni sonucu yüklemesi için süre)
        window._pushScorecardLockUntil = Date.now() + 8000;
        console.log('[CPT10 scorecard] pushScorecard LOCKED for 8s after Search');
    }

    // Kaydedilmiş vardiya var mı? GM köprüsünden oku (HTML cross-domain)
    function hasSavedShift() {
        try {
            const gm = GM_getValue('cpt_shift_saved_gm', '');
            if(gm) {
                const obj = typeof gm==='string' ? JSON.parse(gm) : gm;
                if(obj && obj.from) return obj;
            }
            const local = JSON.parse(localStorage.getItem('cpt_shift_saved')||'{}');
            if(local && local.from) return local;
            return null;
        } catch(e) { return null; }
    }

    // Bugünü set et — SADECE kayıtlı vardiya yoksa
    function setTodayAndSearch() {
        if(_searched) return;
        if(hasSavedShift()) { console.log('[CPT10 scorecard] saved shift exists, skipping setTodayAndSearch'); return; }
        const inputs = [...document.querySelectorAll('input[placeholder="YYYY-MM-DD"]')];
        if(!inputs.length) return;
        const t = new Date();
        const today = `${t.getFullYear()}/${String(t.getMonth()+1).padStart(2,'0')}/${String(t.getDate()).padStart(2,'0')}`;
        inputs.forEach(inp => { if(inp.value !== today) setInput(inp, today); });
        setTimeout(() => {
            const btn = [...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Search');
            if(btn) { btn.click(); _searched=true; console.log('[CPT10 scorecard] today search:', today); }
        }, 600);
    }

    // GM'den vardiya isteği dinle — HTML'den gelir
    setInterval(() => {
        try {
            const req = GM_getValue('cpt_shift_request_gm', null);
            if(!req || !req.fromTime || !req.ts) return;
            const key = req.fromTime + req.toTime + req.ts;
            if(key === _lastShiftKey) return;
            if(Date.now() - req.ts > 60000) return;
            _lastShiftKey = key;
            console.log('[CPT10 scorecard] shift request:', req.fromTime, '-', req.toTime);
            setFiltersAndSearch(req.fromTime, req.toTime);
        } catch(e) {}
    }, 1000);

    // GM'den filter request dinle — HTML "Path Bazlı"/Vardiya butonuna basınca
    // current-scorecard sayfasındaki filtreleri (saat + multiselect) programatik doldur
    // Sayfa navigate etmek yerine in-place doldur, daha hızlı + daha az sorun
    let _lastScorecardUrlTs = 0;
    setInterval(async () => {
        try {
            const req = GM_getValue('cpt_scorecard_url_request_gm', null)
                     || JSON.parse(localStorage.getItem('cpt_scorecard_url_request')||'null');
            if (!req || !req.ts) return;
            if (req.ts === _lastScorecardUrlTs) return;
            if (Date.now() - req.ts > 30000) return;
            _lastScorecardUrlTs = req.ts;

            const fromTime = req.fromTime || '08:00';
            const toTime   = req.toTime   || '23:59';
            const processes = Array.isArray(req.processes) ? req.processes : [];

            console.log('[CPT10 scorecard] filter request →',
                fromTime, '-', toTime, '|', processes.join(',') || 'no processes');
            await setFiltersAndSearch(fromTime, toTime, processes);
        } catch(e) {
            console.log('[CPT10 scorecard] filter request error:', e);
        }
    }, 1000);

    // Sayfa yenilenince kaydedilmiş saatleri uygula (GM'den)
    setTimeout(() => {
        try {
            const saved = hasSavedShift();
            if(saved && saved.from) {
                console.log('[CPT10 scorecard] restoring saved shift:', saved.from, '-', saved.to);
                _searched = true; // setTodayAndSearch'ü tamamen kilitle
                setFiltersAndSearch(saved.from, saved.to);
            }
        } catch(e) { console.warn('[CPT10 scorecard] restore shift failed:', e); }
    }, 1200);

    // Sayfa yüklendikten sonra periyodik olarak vardiyayı tekrar uygula
    // (Amazon sayfası async olduğu için input'lar geç gelebilir)
    // DEADLOCK KORUMASI: kilit aktifken re-apply etme + en fazla 30 sn'de bir uygula.
    // Yoksa drift her 5 sn'de Search basıp 8 sn'lik kilidi yeniler → harvest sonsuz bekler.
    let _lastDriftReapply = 0;
    setInterval(() => {
        try {
            const saved = hasSavedShift();
            if(!saved || !saved.from) return;
            // Devam eden bir Search (kilit) varken tekrar uygulama
            if(window._pushScorecardLockUntil && Date.now() < window._pushScorecardLockUntil) return;
            // En fazla 30 sn'de bir re-apply
            if(Date.now() - _lastDriftReapply < 30000) return;
            // Saat input'larına bak — eğer kaydedilmiş değerden farklıysa tekrar uygula
            const timeInputs = [...document.querySelectorAll('input[placeholder="HH:mm"]')];
            if(timeInputs.length >= 2) {
                if(timeInputs[0].value !== saved.from || timeInputs[1].value !== saved.to) {
                    console.log('[CPT10 scorecard] shift drift detected, re-applying:', saved.from, '-', saved.to);
                    _lastDriftReapply = Date.now();
                    setFiltersAndSearch(saved.from, saved.to);
                }
            }
        } catch(e) { console.warn('[CPT10 scorecard] drift check failed:', e); }
    }, 5000);

    // ─── ROW HARVESTER — Virtual-scroll uyumlu satır biriktirici ───
    // Cloudscape tablosu virtual-scroll yapıyor: aynı anda ~50-100 satır DOM'da.
    // Scroll yaparken yeni satırlar gelir, eski satırlar DOM'dan çıkar.
    // Bu yüzden scroll sırasında her satırı bir Map'e biriktiriyoruz,
    // böylece DOM'dan çıksa bile veriyi kaybetmiyoruz.
    // Map key: login. Map value: full row data.

    function _harvestRows(harvest) {
        // DOM'da görünen tüm satırları parse et ve harvest Map'ine ekle.
        // Aynı zamanda global window._scoreHarvest Map'ine de yazar — veri asla kaybolmaz.
        const rows = document.querySelectorAll('tr.awsui-table-row');
        const headers = [...document.querySelectorAll('thead th')].map(th =>
            th.getAttribute('data-awsui-column-id') || th.textContent.trim().toLowerCase()
        );
        const colIdx = name => {
            const i = headers.indexOf(name); if(i>=0) return i;
            const map = {
                'quantityPicked':  ['quantity picked','picks'],
                'directPickRate':  ['direct pick rate','dpr'],
                'expectedPickRate':['expected pick rate'],
                'perDirectTime':   ['% to direct time','% direct'],
                'actualDirectTime':['actual direct time','actual time'],
                'expectedDirectTime':['expected direct time'],
            };
            for(const alt of (map[name]||[])) {
                const j=headers.findIndex(h=>h.includes(alt)); if(j>=0) return j;
            }
            return -1;
        };

        // Global Map (sürekli birikir, asla küçülmez)
        if (!window._scoreHarvest) window._scoreHarvest = new Map();
        const globalMap = window._scoreHarvest;

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if(cells.length < 4) return;
            let login = '';
            for(let i = 0; i < Math.min(cells.length, 4); i++) {
                const a = cells[i].querySelector('a[href*="/picker/"]');
                if(a) {
                    const m = a.getAttribute('href').match(/\/picker\/([^/?]+)/);
                    if(m) { login = m[1].toLowerCase(); break; }
                }
            }
            if(!login || login.length < 3) return;
            const g = (name, fb) => {
                const i = colIdx(name);
                return (i >= 0 ? cells[i] : fb >= 0 ? cells[fb] : null)?.textContent.trim() || '';
            };
            const rec = {
                login,
                picks: parseInt((g('quantityPicked',2)||'0').replace(/,/g,'')) || 0,
                actDT: g('actualDirectTime',3) || g('actualTime',3) || '',
                expDT: g('expectedDirectTime',4) || g('expectedTime',4) || '',
                pctDT: parseFloat(g('perDirectTime',5)||g('percentToDirectTime',5)) || 0,
                dpr:   parseInt(g('directPickRate',6)||g('pickRate',6)) || 0,
                expPR: parseInt(g('expectedPickRate',7)) || 0,
                ts:    Date.now()
            };
            // Local Map (caller'a verilen)
            if (harvest) harvest.set(login, rec);
            // Global Map (sürekli birikir)
            globalMap.set(login, rec);
        });
    }

    // Scroll yaparken her küçük adımda satırları harvest et.
    // Tabloda 189 satır varsa ve her adımda ~50 satır görünüyorsa,
    // ~4-5 scroll adımıyla hepsini toplayabiliriz.
    // ─── PERSISTENT HARVEST — Sürekli arka planda biriktirir ───
    // window._scoreHarvest: her _harvestRows çağrısında satırlar buraya eklenir.
    // Kullanıcı manuel scroll yapsa da, otomatik scroll yapılsa da, MutationObserver
    // tetiklense de — hep aynı Map'e biriker. Veri asla kaybolmaz.
    window._scoreHarvest = window._scoreHarvest || new Map();

    async function scorecardHarvestAll() {
        const TAG = '[CPT10 harvest]';
        const sleep = ms => new Promise(r => setTimeout(r, ms));

        // Kilit kontrolü — Search bastıktan sonra kilit sürerken harvest başlatma
        // Bu sayede yeni Search sonucu DOM'a tam yansıyıncaya kadar beklenir
        // Kilit kontrolü — ama EN FAZLA 16 sn bekle (DEADLOCK KORUMASI).
        // Drift interval kilidi sürekli yenileyebildiği için üst sınır şart;
        // yoksa "waiting for search to complete..." sonsuza döner.
        const _waitStarted = Date.now();
        while (window._pushScorecardLockUntil && Date.now() < window._pushScorecardLockUntil) {
            if (Date.now() - _waitStarted > 16000) {
                console.warn(TAG, '⏱ wait cap (16s) reached — kilide rağmen devam ediliyor');
                break;
            }
            const wait = window._pushScorecardLockUntil - Date.now();
            console.log(TAG, '⏸ waiting for search to complete...', Math.round(wait/1000), 's');
            await sleep(Math.min(wait + 200, 2000));
        }

        // ⚠ ÖNEMLİ: Her yeni harvest'tan önce global Map'i temizle
        // Yoksa eski search sonuçlarındaki pickerlar (dünkü, başka vardiyadaki) birikir
        // ve "451 picker" gibi şişmiş sayılar görünür. Bu Map sadece o anki search'in
        // sonuçlarını tutmalı.
        window._scoreHarvest = new Map();
        console.log(TAG, '🧹 global Map cleared for fresh harvest');

        // En yakın gerçekten scrollable parent'ı bul — tbody'nin atalarından
        // Cloudscape "All" seçiliyken virtual-scroll wrapper'ında scrollHeight büyür
        const findTableScroller = () => {
            const tbody = document.querySelector('tbody');
            if (!tbody) return null;
            let el = tbody.parentElement;
            while (el && el !== document.body) {
                if (el.scrollHeight > el.clientHeight + 50) {
                    return el;
                }
                el = el.parentElement;
            }
            return null;
        };

        // TÜM scrollable elementleri tara
        const findAllScrollers = () => {
            const all = document.querySelectorAll('*');
            const result = [];
            for (const el of all) {
                if (el.scrollHeight > el.clientHeight + 20) {
                    const cs = getComputedStyle(el);
                    if (cs.overflowY === 'auto' || cs.overflowY === 'scroll' ||
                        cs.overflow === 'auto' || cs.overflow === 'scroll') {
                        result.push(el);
                    }
                }
            }
            result.push(document.scrollingElement || document.documentElement);
            return result;
        };

        const tableScroller = findTableScroller();
        let candidates = findAllScrollers();
        console.log(TAG, 'scrollable containers found:', candidates.length,
            '| table scroller:', tableScroller ? (tableScroller.tagName + '.' + (tableScroller.className+'').slice(0,40)) : 'none');

        // ÖNCE "Found N" başlığını oku — sayfa hazır mı kontrol et
        // Eğer sayfa hâlâ yükleniyor / Search basıldı ama sonuç gelmedi ise bekle
        let expected = 0;
        const getExpected = () => {
            const titleMatch = document.body.textContent.match(/Found (\d+) Scorecard results/i);
            return titleMatch ? parseInt(titleMatch[1]) : 0;
        };

        // Sayfa stabil mi kontrol:
        // 1) "Found N" değeri 3 ardışık ölçümde aynı
        // 2) DOM rows ≤ expected × 1.5 (stale satır yok)
        let stableExpected = 0, stableCount = 0;
        for (let i = 0; i < 12; i++) {  // max 6 saniye bekle
            const cur = getExpected();
            const dom = document.querySelectorAll('tr.awsui-table-row').length;
            const domOK = cur > 0 && dom <= cur * 1.5;
            if (cur === stableExpected && cur > 0 && domOK) {
                stableCount++;
                if (stableCount >= 3) break;  // 3 ardışık stable
            } else {
                stableExpected = cur;
                stableCount = 0;
                if (i % 3 === 0) console.log(TAG, 'waiting for stable... cur:', cur, 'dom:', dom, 'attempt:', i + 1);
            }
            await sleep(500);
        }
        expected = stableExpected;
        console.log(TAG, 'expected total (stable):', expected,
            '| DOM:', document.querySelectorAll('tr.awsui-table-row').length);

        // Şimdi başa scroll + ilk harvest
        for (const c of candidates) { try { c.scrollTop = 0; } catch(e){} }
        window.scrollTo(0, 0);
        await sleep(500);
        _harvestRows();
        console.log(TAG, 'initial harvest size:', window._scoreHarvest.size);

        // DOM'daki satır sayısı expected'i ÇOK aşıyorsa anormal demek
        // (eski + yeni search sonuçları çakışmış olabilir) → Map'i tekrar temizle
        const initialDom = document.querySelectorAll('tr.awsui-table-row').length;
        if (expected > 0 && initialDom > expected * 1.5) {
            console.log(TAG, '⚠ DOM has', initialDom, 'rows but expected only', expected, '— waiting 2s and re-harvesting');
            await sleep(2000);
            window._scoreHarvest = new Map();
            _harvestRows();
            console.log(TAG, 'after re-harvest:', window._scoreHarvest.size);
        }

        const tbody = document.querySelector('tbody');
        const wheelTarget = tbody || document.body;

        let stableRounds = 0;
        let lastSize = window._scoreHarvest.size;
        const maxRounds = 80;  // ~30 saniye, ama erken break edebilir

        for (let round = 0; round < maxRounds && stableRounds < 8; round++) {
            // 1) Tablo scroller'ını KÜÇÜK ADIMLARLA aşağı çek (200px)
            // Küçük adım = virtual-scroll her satırı render etmek için yeterli zaman bulur
            if (tableScroller) {
                try {
                    tableScroller.scrollTop = Math.min(tableScroller.scrollTop + 200, tableScroller.scrollHeight);
                } catch(e) {}
            }

            // 2) Diğer scroller'ları da bir adım çek
            for (const c of candidates) {
                if (c === tableScroller) continue;
                try {
                    c.scrollTop = Math.min(c.scrollTop + 300, c.scrollHeight);
                } catch(e) {}
            }

            // 3) Window scroll
            window.scrollBy(0, 200);

            // 4) Wheel event simüle et
            try {
                const ev = new WheelEvent('wheel', {
                    deltaY: 300,
                    deltaMode: 0,
                    bubbles: true,
                    cancelable: true
                });
                wheelTarget.dispatchEvent(ev);
            } catch(e) {}

            // 5) Her 5 round'da bir End tuşu simüle et
            if (round % 5 === 0) {
                try {
                    const ev = new KeyboardEvent('keydown', {key: 'End', code: 'End', bubbles: true});
                    wheelTarget.dispatchEvent(ev);
                } catch(e) {}
            }

            // 6) Son satırı scrollIntoView ile aşağı zorla
            try {
                const allRows = document.querySelectorAll('tr.awsui-table-row');
                if (allRows.length) {
                    allRows[allRows.length - 1].scrollIntoView({block: 'end', behavior: 'instant'});
                }
            } catch(e) {}

            await sleep(350);
            _harvestRows();

            const sizeNow = window._scoreHarvest.size;
            const domNow = document.querySelectorAll('tr.awsui-table-row').length;
            console.log(TAG, 'round', round + 1, '| DOM:', domNow, '| harvested:', sizeNow,
                expected ? `(${Math.round(100*sizeNow/expected)}%)` : '');

            if (sizeNow === lastSize) {
                stableRounds++;
            } else {
                stableRounds = 0;
                lastSize = sizeNow;
            }

            // Hedefe ulaştıysa çık
            if (expected && sizeNow >= expected) {
                console.log(TAG, '✓ reached expected total');
                break;
            }

            // Yeni scrollable container ortaya çıkmış olabilir
            if (round % 8 === 0) candidates = findAllScrollers();
        }

        // Son tarama: Home → End → harvest
        try { tableScroller && (tableScroller.scrollTop = 0); } catch(e) {}
        await sleep(300);
        _harvestRows();
        try { tableScroller && (tableScroller.scrollTop = tableScroller.scrollHeight); } catch(e) {}
        await sleep(300);
        _harvestRows();

        console.log(TAG, 'DONE — total unique:', window._scoreHarvest.size,
            expected ? `/ ${expected}` : '');
        return window._scoreHarvest;
    }

    // ─── KALICI İZLEYİCİ ───
    // Kullanıcı veya sayfa sayfayı scroll ettiğinde, MutationObserver yeni satırları izleyince,
    // her durumda harvest yap. Global Map asla küçülmez — sadece büyür.
    function startPersistentHarvest() {
        // Scroll dinleyicisi (passive)
        const onAnyScroll = () => {
            clearTimeout(window._scrollHarvestTimer);
            window._scrollHarvestTimer = setTimeout(() => {
                _harvestRows(window._scoreHarvest);
            }, 150);
        };
        window.addEventListener('scroll', onAnyScroll, {passive: true, capture: true});
        document.addEventListener('scroll', onAnyScroll, {passive: true, capture: true});
        console.log('[CPT10 harvest] persistent scroll listener attached');
    }
    startPersistentHarvest();

    // pushScorecard: harvest map'ini alır (yoksa DOM'dan görünenleri parse eder)
    // Bu sayede ya tam harvest (scorecardHarvestAll'dan) ya da hızlı snapshot (MutationObserver) kullanılabilir.
    // Sayfadaki aktif from/to saat input'larını oku — birden fazla strateji
    function readPageTimes() {
        try {
            // Yöntem 1: placeholder="HH:mm" — en güvenilir
            let timeInputs = [...document.querySelectorAll('input[placeholder="HH:mm"]')];
            // Yöntem 2: value HH:MM formatında
            if (timeInputs.length < 2) {
                timeInputs = [...document.querySelectorAll('input')]
                    .filter(i => /^\d{2}:\d{2}$/.test(i.value));
            }
            if (timeInputs.length >= 2) {
                return { fromTime: timeInputs[0].value, toTime: timeInputs[1].value, found: timeInputs.length };
            }
            return { fromTime: '', toTime: '', found: timeInputs.length };
        } catch(e) {
            return { fromTime: '', toTime: '', found: 0 };
        }
    }

    function pushScorecard(harvest) {
        // Kilit kontrolü — setFiltersAndSearch sonrası 8 saniye stale DOM yazılmasın
        if (window._pushScorecardLockUntil && Date.now() < window._pushScorecardLockUntil) {
            console.log('[CPT10 scorecard] push LOCKED, skipping (',
                Math.round((window._pushScorecardLockUntil - Date.now())/1000), 's remaining)');
            return;
        }
        let data = {};

        // Eğer global harvest map'i daha büyükse onu kullan
        const effectiveHarvest = (harvest && harvest.size > (window._scoreHarvest?.size || 0))
            ? harvest
            : window._scoreHarvest;

        if (effectiveHarvest && effectiveHarvest.size) {
            effectiveHarvest.forEach((v, k) => { data[k] = v; });
        } else {
            // Snapshot mode: DOM'da görünenleri parse et
            const m = new Map();
            _harvestRows(m);
            m.forEach((v, k) => { data[k] = v; });
        }

        // "No data found" durumu kontrolü:
        // Eğer DOM'da hiç satır yoksa AMA "Found ... results" başlığı varsa,
        // arama yapıldı ama sonuç boş demek — eski veriyi temizle
        const dataCount = Object.keys(data).length;
        const hasNoDataMsg = !!document.querySelector('tbody td.awsui-table-no-match-cell, .awsui-table-empty-cell') ||
                             !!document.body.textContent.match(/No data found|Found no Scorecard/i);
        const searchPerformed = !!document.body.textContent.match(/Found (no |\d)/i);

        // Boş sonuç + arama yapıldı → eski cache'i temizle
        if (dataCount === 0 && searchPerformed && hasNoDataMsg) {
            // SAYFADAKİ aktif filtreyi oku — bekleyen request'i değil!
            // Çünkü request'in saatleri sayfada filtre değişene kadar farklı olabilir
            // (race condition: req=08:00-16:00 ama sayfa hâlâ 16:00-00:00 gösteriyor).
            const tp = readPageTimes();
            const pageFromTime = tp.fromTime, pageToTime = tp.toTime;
            console.log('[CPT10 scorecard] empty branch — time inputs:', pageFromTime, '-', pageToTime, '(found', tp.found, ')');

            const isFullDayEmpty = (pageFromTime === '00:00' && (pageToTime === '23:59' || pageToTime === '24:00'))
                                   || (!pageFromTime && !pageToTime);

            if (isFullDayEmpty) {
                push('cpt_scorecard_v9', {data: {}, ts: Date.now(), empty: true});
                console.log('[CPT10 scorecard] FULL-DAY EMPTY — full-day cache cleared');
            } else {
                // Vardiya filtreli empty → SADECE sayfa filtresine göre yaz
                const resp = {data: {}, fromTime: pageFromTime, toTime: pageToTime, ts: Date.now(), empty: true};
                try { GM_setValue('cpt_shift_scorecard_gm', resp); } catch(e){}
                push('cpt_shift_scorecard', resp);
                console.log('[CPT10 scorecard] SHIFT EMPTY (', pageFromTime, '-', pageToTime, ') — shift cache cleared');
            }

            // Bekleyen vardiya isteği varsa SADECE sayfa filtresi tam eşleşiyorsa cevap yaz
            try {
                const req = GM_getValue('cpt_shift_request_gm', null);
                if(req && req.fromTime && (Date.now()-req.ts) < 60000
                   && req.fromTime === pageFromTime && req.toTime === pageToTime) {
                    const resp = {data: {}, fromTime:req.fromTime, toTime:req.toTime, ts:Date.now(), empty: true};
                    GM_setValue('cpt_shift_scorecard_gm', resp);
                    push('cpt_shift_scorecard', resp);
                    console.log('[CPT10 scorecard] shift EMPTY response matched', req.fromTime, '-', req.toTime);
                }
            } catch(e) {}
            return;
        }

        if(dataCount) {
            // Sayfadaki aktif from-to saatlerini oku
            // 00:00-23:59 ise tüm gün → cpt_scorecard_v9'a yaz
            // Aksi halde vardiya filtreli → sadece cpt_shift_scorecard'a yaz
            // (cpt_scorecard_v9 tüm günü temsil etmeli, vardiya filtresi onu bozmasın)
            // Cloudscape time input'larını birden fazla yolla bul
            const tp = readPageTimes();
            const pageFromTime = tp.fromTime, pageToTime = tp.toTime;
            console.log('[CPT10 scorecard] time inputs read:', pageFromTime, '-', pageToTime,
                '(found', tp.found, 'inputs)');

            const isFullDay = (pageFromTime === '00:00' && (pageToTime === '23:59' || pageToTime === '24:00'))
                              || (!pageFromTime && !pageToTime);

            // Sayfanın "Found N" değerini oku — sanity check
            // Eğer dataCount "Found N"'yi ÇOK aşıyorsa, eski + yeni search sonuçları
            // çakışmış demek (DOM stale). Bu durumda push'ü atla, bir sonraki round'da düzelir.
            const titleMatch = document.body.textContent.match(/Found (\d+) Scorecard results/i);
            const pageExpected = titleMatch ? parseInt(titleMatch[1]) : 0;
            if (pageExpected > 0 && dataCount > pageExpected * 1.5) {
                console.log('[CPT10 scorecard] ⚠ dataCount', dataCount, 'exceeds page expected', pageExpected,
                    '— DOM stale, skipping push');
                return;
            }

            if (isFullDay) {
                // Tüm gün scorecard → ana cache
                push('cpt_scorecard_v9', {data, ts: Date.now()});
                console.log('[CPT10 scorecard] pushed', dataCount, 'pickers to FULL-DAY cache',
                    harvest ? '(harvest)' : '(snapshot)');
            } else {
                // Vardiya filtreli → her zaman cpt_shift_scorecard'a yaz
                // (sayfa filtresi neyse, o vardiya verisini yansıt)
                const resp = {data, fromTime: pageFromTime, toTime: pageToTime, ts: Date.now()};
                try { GM_setValue('cpt_shift_scorecard_gm', resp); } catch(e){}
                push('cpt_shift_scorecard', resp);
                console.log('[CPT10 scorecard] pushed', dataCount, 'pickers to SHIFT cache (',
                    pageFromTime, '-', pageToTime, ')', harvest ? '(harvest)' : '(snapshot)');
            }

            // Eğer açıkça bir vardiya isteği bekliyorsa, ona da cevap yaz
            try {
                const req = GM_getValue('cpt_shift_request_gm', null);
                if(req && req.fromTime && (Date.now()-req.ts) < 60000) {
                    // Sayfa filtresi istenen vardiya ile eşleşiyorsa cevap yaz
                    if (pageFromTime === req.fromTime && pageToTime === req.toTime) {
                        const resp = {data, fromTime:req.fromTime, toTime:req.toTime, ts:Date.now()};
                        GM_setValue('cpt_shift_scorecard_gm', resp);
                        push('cpt_shift_scorecard', resp);
                        console.log('[CPT10 scorecard] shift response written', req.fromTime, '-', req.toTime);
                    }
                }
            } catch(e) {}
        }
    }

    // Tarih set et ve search bas
    setTimeout(setTodayAndSearch, 500);
    setTimeout(setTodayAndSearch, 1500);
    setTimeout(setTodayAndSearch, 3500);

    // İlk dolum: 5 saniye sonra (API interceptor zaten daha hızlı yakalar ama yedek olarak)
    setTimeout(async () => {
        const harvest = await scorecardHarvestAll();
        pushScorecard(harvest);
    }, 5000);
    // Periyodik: 30sn'de bir harvest (45sn yerine — daha güncel)
    setInterval(async () => {
        const harvest = await scorecardHarvestAll();
        pushScorecard(harvest);
    }, 30000);

    // MutationObserver: hızlı snapshot için (harvest beklemeden anında push)
    // GUARD: DOM'daki satır sayısı "Found N" ile uyumlu olmadıkça push yapma
    // (Search arası geçici stale durumda yanlış sayı yazılmasını engeller)
    const obs = new MutationObserver(() => {
        clearTimeout(window._sct);
        window._sct = setTimeout(() => {
            // Stable check: DOM rows ≈ Found N olmalı
            const titleMatch = document.body.textContent.match(/Found (\d+) Scorecard results/i);
            const expected = titleMatch ? parseInt(titleMatch[1]) : 0;
            const domCount = document.querySelectorAll('tr.awsui-table-row').length;
            // Eğer expected biliniyor AMA DOM'da ÇOK fazla satır varsa stale demek
            if (expected > 0 && domCount > expected * 1.5) {
                console.log('[CPT10 scorecard] snapshot SKIPPED — DOM stale (DOM:', domCount, 'expected:', expected, ')');
                return;
            }
            pushScorecard();
        }, 800);
    });
    function attachObs() {
        const tb = document.querySelector('tbody');
        if(tb) obs.observe(tb, {childList:true, subtree:true});
        else setTimeout(attachObs, 500);
    }
    attachObs();

    // No-data detection — observer "no data" cell değişmezse tetiklenmez
    // O yüzden 5 saniyede bir bağımsız tarama yapalım: sayfada "No data" veya
    // "Found no" görüyorsak boş scorecard sinyali yolla
    // ÖNEMLİ: "Found no" yazısı en az 4 saniyedir SABİT durmalı, yoksa Search
    // arasındaki geçici boşlukları "vardiya başlamadı" sanırız.
    let _emptyFirstSeenTs = 0;
    let _emptyLastSent = 0;
    setInterval(() => {
        try {
            const text = document.body.textContent || '';
            const isEmpty = /Found no Scorecard|No data found/i.test(text);

            if (!isEmpty) {
                _emptyFirstSeenTs = 0;
                _emptyLastSent = 0;
                return;
            }

            // İlk kez boş gördük — timestamp koy
            if (!_emptyFirstSeenTs) {
                _emptyFirstSeenTs = Date.now();
                console.log('[CPT10 scorecard] "no data" detected, waiting 4s to confirm...');
                return;
            }

            // 4 saniyeden az süredir boş ise henüz emin değiliz (Search arası olabilir)
            if (Date.now() - _emptyFirstSeenTs < 4000) return;

            // 15 saniyede en az bir kez gönder (sayfa boş kaldığı sürece tekrar tekrar)
            if (Date.now() - _emptyLastSent < 15000) return;
            _emptyLastSent = Date.now();
            pushScorecard();
            console.log('[CPT10 scorecard] confirmed empty after 4s → empty signal sent');
        } catch(e) {}
    }, 2000);

    setInterval(() => { if(autoRefreshOn()) location.reload(); }, 60000);
    return;
}

// ════════════════════════════════════════════════════════
//  ALL-IN-SCANNER
// ════════════════════════════════════════════════════════
if (IS_SCANNER) {
    function pushScanner() {
        const rows=document.querySelectorAll('tr.awsui-table-row');
        const counts={}, cpts={};
        rows.forEach(row=>{
            const cells=row.querySelectorAll('td'); if(cells.length<2) return;
            const lnk=cells[1]?.querySelector('a');
            const m=(lnk?.getAttribute('href')||'').match(/\/picker\/([^/?]+)/); if(!m) return;
            const login=m[1].toLowerCase();
            row.querySelectorAll('time[datetime]').forEach(t=>{const dt=t.getAttribute('datetime');if(dt&&/^\d+$/.test(dt)&&!cpts[login])cpts[login]=tsToHHMM(parseInt(dt));});
            for(let i=2;i<Math.min(cells.length,7);i++){const v=parseInt(cells[i].textContent);if(v>0){counts[login]=v;break;}}
        });
        if(Object.keys(cpts).length)   push('cpt_scanner_cpt_v9',{data:cpts,ts:Date.now()});
        if(Object.keys(counts).length)  push('cpt_picker_counts_v9',{data:counts,ts:Date.now()});
    }
    setTimeout(pushScanner,500);
    setInterval(pushScanner,5000);
    observeTbody(pushScanner, 200);
    setInterval(()=>{if(autoRefreshOn())location.reload();},60000);
    return;
}

// ════════════════════════════════════════════════════════
//  PICK-BATCHES — v10.23'te KALDIRILDI
//  Rate hesabı artık cpt_picker_counts_v9 (Scanner) üzerinden yapılıyor.
//  Pick Batches sayfası artık kullanılmıyor.
// ════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════
//  INDIVIDUAL SCORECARD
// ════════════════════════════════════════════════════════
if (IS_INDV_SC) {
    const lm=P.match(/\/picker\/([^/]+)/); if(!lm) return;
    const login=lm[1].toLowerCase();
    function pushIndv() {
        const headers=[...document.querySelectorAll('thead th[data-awsui-column-id]')].map(th=>th.getAttribute('data-awsui-column-id'));
        if(!headers.length) return;
        const idx=n=>headers.indexOf(n);
        const rows=[...document.querySelectorAll('tbody tr.awsui-table-row')].map(tr=>{
            const cells=[...tr.querySelectorAll('td')].map(td=>td.textContent.trim());
            return{date:cells[idx('date')]||'',picks:parseInt(cells[idx('picks')])||0,actualRate:parseInt(cells[idx('actualPickRate')])||0,expectedRate:parseInt(cells[idx('expectedPickRate')])||0,pctToGoal:parseInt(cells[idx('percentToGoal')])||0};
        }).filter(r=>r.date);
        if(!rows.length) return;
        let store={};
        try{store=JSON.parse(GM_getValue('cpt_individual_rates_v9','{}')||'{}');}catch(e){}
        store[login]={login,history:rows.slice(-14),ts:Date.now()};
        const s=JSON.stringify(store);
        try{localStorage.setItem('cpt_individual_rates_v9',s);}catch(e){}
        try{GM_setValue('cpt_individual_rates_v9',store);}catch(e){}
    }
    setTimeout(pushIndv,1000);
    new MutationObserver(()=>{clearTimeout(window._it);window._it=setTimeout(pushIndv,500);}).observe(document.body,{childList:true,subtree:true});
    return;
}

// ════════════════════════════════════════════════════════
//  PICK-AREAS — sadece veri oku, sayfaya dokunma
// ════════════════════════════════════════════════════════
if (IS_PICK_AREAS && !IS_IFRAME) {   // v12.47: iframe'de bu blok çalışmaz (sonsuz reload/çift-çekim önlenir; ayar orkestratöre bırakılır)
    // v10.20: Time-based empty guard (DOM observer geçici 0 area gösterebilir)
    let _lastGoodAreasDom = Date.now();
    const AREAS_DOM_THRESHOLD = 45000;  // 45sn boş ise temizle
    function pushPickAreas() {
        const rows = document.querySelectorAll('table tbody tr');
        if(!rows.length) return;
        const ths = [...document.querySelectorAll('table thead th')];
        let tuIdx=5, pkIdx=6;
        ths.forEach((th,i) => {
            const t=th.textContent.trim().toLowerCase();
            if(t==='total units') tuIdx=i; else if(t==='pickers') pkIdx=i;
        });
        const data={}, pathSet=new Set();
        document.querySelectorAll('a[href*="/process-path/PP"]').forEach(a=>{
            const m=(a.getAttribute('href')||'').match(/\/process-path\/(PP\w+)/);
            if(m) pathSet.add(m[1]);
        });
        rows.forEach(row => {
            const cells=row.querySelectorAll('td'); if(cells.length<4) return;
            const area=cells[0].textContent.trim().toLowerCase();
            if(!area||area==='pick area') return;
            const pathLink=cells[1].querySelector('a');
            let pp='';
            if(pathLink) { const m=(pathLink.getAttribute('href')||'').match(/\/process-path\/(PP\w+)/); pp=m?m[1]:pathLink.textContent.trim(); }
            else pp=cells[1].textContent.trim();
            if(pp?.startsWith('PP')) pathSet.add(pp);
            const batchId=cells[2].querySelector('a')?.textContent.trim()||'0';
            const tu=parseInt((cells[tuIdx]?.textContent||'').replace(/\D/g,''))||0;
            const pk=parseInt((cells[pkIdx]?.textContent||'').replace(/\D/g,''))||0;
            if(tu>0) data[`${area}|${pp||'all'}|${batchId}`]={area,remaining:tu,picked:0,pickers:pk,processPath:pp};
        });
        if(!Object.keys(data).length) {
            // v10.23: Boş cevap → cache'e DOKUNMA, eski dolu veri korunur
            return;
        }
        // Dolu cevap → lastGoodTs güncelle
        _lastGoodAreasDom = Date.now();
        try { (read('cpt_pick_areas_v9')?.allPaths||[]).forEach(p=>pathSet.add(p)); } catch(e){}
        const allPaths=[...pathSet].sort();
        let activePickers=0;
        document.querySelectorAll('.awsui-util-label').forEach(el=>{
            if(el.textContent.trim()==='Active Pickers'){
                const v=parseInt((el.nextSibling||el.parentElement?.nextElementSibling)?.textContent||'');
                if(v>0) activePickers=v;
            }
        });
        const pathTotals={};
        Object.values(data).forEach(d=>{
            if(d.processPath&&d.processPath!=='all')
                pathTotals[d.processPath]=(pathTotals[d.processPath]||0)+(d.remaining||0);
        });
        push('cpt_pick_areas_v9',{data,selectedPaths:allPaths,allPaths,activePickers,pathTotals,ts:Date.now()});
        console.log('[CPT10 pick-areas]',Object.keys(data).length,'rows,',allPaths.length,'paths');
    }
    setTimeout(pushPickAreas, 500);
    setInterval(pushPickAreas, 30000);
    observeTbody(pushPickAreas, 500);
    setInterval(()=>{ if(autoRefreshOn()) location.reload(); }, 60000);

    // v10.25: HTML "🔄 Yenile" butonundan reload sinyali dinle
    // HTML force-fetch sinyali yolladığında what='pickareas-reload' ise C4 sekmesi F5 yapar.
    // Yenilendikten sonra observer ve setTimeout(pushPickAreas, 500) cache'i hızla doldurur.
    let _lastPaReloadTs = 0;
    setInterval(() => {
        try {
            let req = null;
            try { req = GM_getValue('cpt_force_fetch_gm', null); } catch(e) {}
            if (!req) {
                const raw = localStorage.getItem('cpt_force_fetch');
                if (raw) req = JSON.parse(raw);
            }
            if (!req?.ts || req.ts === _lastPaReloadTs) return;
            _lastPaReloadTs = req.ts;
            if (Date.now() - req.ts > 15000) return;
            // Sadece pickareas-reload veya all sinyalinde tepki ver
            if (req.what === 'pickareas-reload') {
                dlog('🔔 Pick Areas C4: HTML reload sinyali alındı → location.reload()');
                setTimeout(() => location.reload(), 50);
            }
        } catch(e) {}
    }, 800);

    return;
}

// ════════════════════════════════════════════════════════
//  RODEO ExSD
// ════════════════════════════════════════════════════════
if (IS_EXSD) {
    dlog(`🟢 Rodeo ExSD bloğu yüklendi${IS_EXSD_FRACS ? ' · FRACS sayfası (isFracs=true flag yazılacak)' : ' · Normal sayfa'}`);
    const MONTHS_EN={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
    function pushExSD() {
        const cptMap=[];
        document.querySelectorAll('table thead tr.header-row th').forEach(th=>{
            const dl=th.querySelector('.day-label'); if(!dl) return;
            const tm=th.textContent.trim().match(/(\d{2}):(\d{2})\s*$/); if(!tm) return;
            const parts=dl.textContent.trim().split(' '); if(parts.length<2) return;
            const mo=MONTHS_EN[parts[0]], dt=parseInt(parts[1]);
            if(isNaN(mo)||isNaN(dt)) return;
            const d=new Date(new Date().getFullYear(),mo,dt,+tm[1],+tm[2]);
            if(d.getTime()<Date.now()-8*3600000) d.setFullYear(d.getFullYear()+1);
            cptMap.push(d.getTime());
        });
        if(!cptMap.length) return;
        const result={};
        let pickingRow=null;
        document.querySelectorAll('table tbody tr').forEach(tr=>{const l=tr.querySelector('th.row-label');if(l&&l.textContent.includes('Picking Subtotal'))pickingRow=tr;});
        if(!pickingRow) return;
        pickingRow.querySelectorAll('td').forEach(td=>{
            const a=td.querySelector('a'); if(!a) return;
            const href=a.getAttribute('href')||'';
            const sm=href.match(/ExSDRange\.RangeStartMillis=(\d+)/), em=href.match(/ExSDRange\.RangeEndMillis=(\d+)/);
            const count=parseInt(a.textContent.trim().replace(/,/g,''))||0;
            if(!sm||!em||!count) return;
            const mid=Math.round((parseInt(sm[1])+parseInt(em[1]))/2/60000)*60000;
            let best=null,bestDiff=Infinity;
            cptMap.forEach(ts=>{const d=Math.abs(ts-mid);if(d<bestDiff){bestDiff=d;best=ts;}});
            if(best&&bestDiff<7200000) result[String(best)]=(result[String(best)]||0)+count;
        });
        if(Object.keys(result).length) push('cpt_not_yet_picked_v9',{data:result,ts:Date.now()});

        // v11.50: PLANNED Subtotal satırını da oku → cpt_planned_subtotal_v9
        //   Tracker'da CPT kutusuna "Picking + Planned" toplam iş gösterimi için.
        let plannedRow=null;
        document.querySelectorAll('table tbody tr').forEach(tr=>{const l=tr.querySelector('th.row-label');if(l&&/Planned\s*Subtotal/i.test(l.textContent||''))plannedRow=tr;});
        if(plannedRow){
            const plannedResult={};
            plannedRow.querySelectorAll('td').forEach(td=>{
                // Planned satırında link olmayabilir; hem <a> hem düz metin dene
                const a=td.querySelector('a');
                const txt=(a?a.textContent:td.textContent||'').trim();
                const count=parseInt(txt.replace(/,/g,''))||0;
                if(!count) return;
                let sm=null,em=null;
                if(a){const href=a.getAttribute('href')||'';const m1=href.match(/ExSDRange\.RangeStartMillis=(\d+)/);const m2=href.match(/ExSDRange\.RangeEndMillis=(\d+)/);if(m1)sm=m1[1];if(m2)em=m2[1];}
                if(sm&&em){
                    const mid=Math.round((parseInt(sm)+parseInt(em))/2/60000)*60000;
                    let best=null,bestDiff=Infinity;
                    cptMap.forEach(ts=>{const d=Math.abs(ts-mid);if(d<bestDiff){bestDiff=d;best=ts;}});
                    if(best&&bestDiff<7200000) plannedResult[String(best)]=(plannedResult[String(best)]||0)+count;
                } else {
                    // Link yoksa: kolon sırasına göre cptMap ile eşle (header ile aynı sıra)
                    // (td index'i header index'ine denk gelir; ama Total/Earlier/Range kolonları başta)
                }
            });
            // Link bulunamadıysa kolon-sıralı fallback dene
            if(Object.keys(plannedResult).length===0){
                const tds=Array.from(plannedRow.querySelectorAll('td'));
                // Son cptMap.length kadar td, CPT saatlerine denk gelir (Total/Earlier/Range başta)
                const cptTds=tds.slice(Math.max(0,tds.length-cptMap.length));
                cptTds.forEach((td,i)=>{
                    const count=parseInt((td.textContent||'').trim().replace(/,/g,''))||0;
                    if(count&&cptMap[i]) plannedResult[String(cptMap[i])]=count;
                });
            }
            if(Object.keys(plannedResult).length) push('cpt_planned_subtotal_v9',{data:plannedResult,ts:Date.now()});
        }
    }
    setTimeout(pushExSD,1000);
    setInterval(pushExSD,15000);
    setTimeout(()=>{const t=document.querySelector('table');if(t){const o=new MutationObserver(()=>{clearTimeout(window._exT);window._exT=setTimeout(pushExSD,500);});o.observe(t,{childList:true,subtree:true});}},2000);

    // ═══════════════════════════════════════════════════════════
    // TRANSIT TOTES FETCHER
    // ───────────────────────────────────────────────────────────
    // Sadece Rodeo ExSD sayfası açıkken çalışır. ItemList URL'ini
    // ExSD'nin kendi linklerinden kazır (DOM scraping), URL'i
    // elle inşa etmek yerine. streamPages ile sayfa sayfa çekip
    // aynı origin'den (cookie/midway dahil) gelen veriyi parse
    // eder. FC Research'ten employee/lastPick zenginleştirir.
    // Sonuç cpt_transit_batches_v9 formatında yazılır.
    // ═══════════════════════════════════════════════════════════
    (function transitFetcher() {
        const TR_FC               = 'IST2';

        // v11.78: STALE CACHE TEMİZLİĞİ — eski script sürümleri cache'e "totes={} + grandTotal>0"
        //   gibi bozuk bir durum yazmış olabilir (boş liste ama pozitif özet). Bu, pano'da
        //   "2.022 transit / 0 tote" yanılgısına ve 8sn refresh'in "Yenilendi" yalanına yol açıyordu.
        //   Script yüklenir yüklenmez böyle bozuk bir kayıt varsa SİL → temiz başlangıç, ilk
        //   başarılı tarama doğru veriyle doldurur.
        try {
            const _raw = localStorage.getItem('cpt_transit_batches_v9');
            if (_raw) {
                const _o = JSON.parse(_raw);
                const _d = (_o && _o.data) || _o;
                const _toteCount = (_d && _d.totes) ? Object.keys(_d.totes).length : 0;
                const _gt = (_d && _d.grandTotal) || 0;
                if (_toteCount === 0 && _gt > 0) {
                    localStorage.removeItem('cpt_transit_batches_v9');
                    try { GM_deleteValue && GM_deleteValue('cpt_transit_batches_v9'); } catch(e) {}
                    dlog('🧹 Bozuk stale cache temizlendi (totes=0 ama özet=' + _gt + ') → temiz başlangıç');
                }
            }
        } catch (e) {}

        const TR_MAX_PAGES        = 200;    // v11.56: derin sayfalama
        const TR_FC_CONCURRENCY   = 40;     // v12.54: 100→40 — asıl yük artık TOPLU okumada; 100
                                            //   paralel tekli istek FC'yi boğup timeout üretiyor, o da
                                            //   (eski neg-cache hatasıyla) 'Bilinmeyen' yığını yapıyordu.
                                            //   v12.52: 70→100 — dwell öncelikli kuyrukla birlikte
                                            //   'Bilinmeyen' daha hızlı boşalsın (FC ayrı host, 5sn timeout
                                            //   hasarı sınırlar; 40→60→70 artışlarının hepsi sorunsuz oldu).
                                            //   v12.24: 60→70 — "Bilinmeyen lokasyon"daki tote'lar daha
                                            //   hızlı dolsun (yeni tote'lar öncelikli çekiliyor + daha çok
                                            //   paralel). v12.10: 40→60 — 300+ tote enrichment 60sn refresh içinde
                                            //   BİTMİYORDU (40sn+ sürüp yeni taramaya çarpıyordu, 100+ tote
                                            //   enrichment'sız "Bilinmeyen lokasyon"da kalıyordu). FC farklı host
                                            //   olduğu için Rodeo'yu etkilemez, enrichment hızlanır.
        const TR_FC_HOURS         = 8;      // v11.81: 4→8 saat — uzun transit kalan tote'lar da yakalansın (eski hareketleri kaçırma)
        const TR_PAGE_TIMEOUT_MS  = 20000;  // v11.77: 15000→20000 — size=3000 sayfa için pay (büyük günde yavaş yanıt)
        const TR_FC_TIMEOUT_MS    = 5000;   // v12.10: 8000→5000 — takılan FC isteği 5sn'de pes etsin, pool
                                            //   tıkanmasın. Yanıt veren tote'lar zaten <2sn geliyor; 8sn bekleyen
                                            //   istek zaten boş/hatalı → 5sn yeterli, enrichment akışı hızlanır.
        const TR_EMP_CACHE_KEY    = 'cpt_transit_emp_cache_v4'; // v10.86: fcFloor/floorLoc eklendi → eski cache geçersiz
        const TR_EMP_CACHE_TTL    = 300 * 1000; // v12.04: 60sn → 300sn (5dk). Eskiden tam 60sn olunca
                                                //   ikinci tarama başlarken cache yaşı = TTL sınırında
                                                //   olup expire ediyor, pano boşalıyordu. 5dk pay verir.
                                                //   Hybrid/Rodeo'dan düşme yine ANINDA olur (cache değil
                                                //   Rodeo doğruluk kaynağı), sadece lokasyon/picker
                                                //   güncellemesi 5dk gecikme — kabul edilebilir.
        const TR_EMP_NEG_TTL      = 120 * 1000; // v12.04: 30sn → 120sn — boş yanıt cache'i

        const tClean = s => (s == null ? '' : String(s)).replace(/\s+/g, ' ').trim();
        const tAbs   = (b, h) => { try { return new URL(h, b).href; } catch { return h; } };
        const tDelay = ms => new Promise(r => setTimeout(r, ms));

        // GET wrapper — headers yok, withCredentials yok (aynı origin'de çalıştığımız için gerek yok)
        function trGet(url, timeoutMs) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET', url, nocache: true, timeout: timeoutMs || 15000,
                    onload: resolve,
                    onerror: reject,
                    ontimeout() { reject(new Error('timeout')); }
                });
            });
        }

        // Dwell parser — "1h 25m", "1:25", "25m" gibi formatları dakikaya çevirir
        function tParseDwell(s) {
            s = tClean(s).toLowerCase(); if (!s) return 0;
            let m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
            if (m) return m[3] != null ? +m[1]*60 + +m[2] + +m[3]/60 : +m[1] + +m[2]/60;
            const h = s.match(/(\d+(?:\.\d+)?)\s*h/), mi = s.match(/(\d+(?:\.\d+)?)\s*m/);
            if (h || mi) return (h ? +h[1]*60 : 0) + (mi ? +mi[1] : 0);
            const n = parseFloat(s.replace(',', '.'));
            return isNaN(n) ? 0 : n;
        }

        // ExSD cell ("2026-05-20 13:30") → {cpt:"2026-05-20 13:30", cptTs:ms}
        // NOT: cpt artık tarih+saat key. Aynı saat farklı günler ayrı CPT olarak görünür.
        // HTML render tarafı bu key'i parse edip "20 May · 13:30" gibi gösterir.
        function tFmtCptKey(ts) {
            const d = new Date(ts);
            const Y = d.getFullYear();
            const M = String(d.getMonth()+1).padStart(2,'0');
            const D = String(d.getDate()).padStart(2,'0');
            const h = String(d.getHours()).padStart(2,'0');
            const mi= String(d.getMinutes()).padStart(2,'0');
            return Y + '-' + M + '-' + D + ' ' + h + ':' + mi;
        }
        function tParseCptCell(txt) {
            if (!txt) return { cpt:'', cptTs:null };
            const m = txt.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
            if (m) {
                const d = new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5]);
                return { cpt: tFmtCptKey(d.getTime()), cptTs: d.getTime() };
            }
            // Sadece HH:MM bulunduysa: bugünü varsay (geçmişse yarın)
            const m2 = txt.match(/(\d{2}):(\d{2})/);
            if (!m2) return { cpt:'', cptTs:null };
            const now = new Date();
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), +m2[1], +m2[2]);
            // Eğer parse edilen saat şu andan ÇOK gerideyse (4+ saat) yarın varsay
            if (d.getTime() < now.getTime() - 4*3600000) d.setDate(d.getDate()+1);
            return { cpt: tFmtCptKey(d.getTime()), cptTs: d.getTime() };
        }

        // ════════════════════════════════════════════════════════════
        // v11.53: GÜN-GÜN ÇEKİM yardımcıları
        //   Eski hâl: ExSD'den TEK ItemList linki kazınıp onun aralığıyla çekiliyordu →
        //   yoğun günde uzak tarihler (+2/+3 gün) aralığa/sayfalamaya takılıp gelmiyordu.
        //   Yeni hâl: ExSD özetinden HANGİ GÜNLERDE CPT var öğren, SADECE o günleri
        //   GÜN-GÜN, PARALEL çek (her gün kendi ExSDRange'i) → kesinti yok, hepsi gelir.
        //   Tarih SORGU GÜNÜNE sabit (hücre eksik/bozuk olsa bile doğru), saat hücreden.
        // ════════════════════════════════════════════════════════════
        const TR_DAY_CONC    = 3;   // aynı anda kaç gün sorgusu (paralel)
        const TR_CPT_CONC    = 20;  // v11.78: 12→20 — wide 0 dönünce tüm CPT'leri daha hızlı paralel çek (hız)
        const TR_EXTRA_BACK  = 1;   // ExSD'de görünmese de geriye eklenecek gün (dün)
        const TR_EXTRA_AHEAD = 2;   // ExSD'de görünmese de ileriye eklenecek gün (+bugün+2)

        // "YYYY-MM-DD" günün [00:00:00.000 .. 23:59:59.999] ms aralığı (günler örtüşmez)
        function tDayBounds(dateObj) {
            const s = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
            return { start: s.getTime(), end: s.getTime() + 86400000 - 1 };
        }
        // "YYYY-MM-DD" → Date (yerel gece yarısı)
        function tYmdToDate(ymd) {
            const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})/);
            return m ? new Date(+m[1], +m[2]-1, +m[3], 0, 0, 0, 0) : null;
        }
        // ItemList URL'inin ExSDRange'ini verilen güne ayarla (param yoksa ekler)
        function tSetUrlRange(url, startMs, endMs) {
            try {
                const u = new URL(url, location.href);
                u.searchParams.set('ExSDRange.RangeStartMillis', String(startMs));
                u.searchParams.set('ExSDRange.RangeEndMillis', String(endMs));
                if (!u.searchParams.has('size')) u.searchParams.set('size', '2000');
                return u.toString();
            } catch {
                let out = url;
                if (/ExSDRange\.RangeStartMillis=\d+/.test(out)) out = out.replace(/ExSDRange\.RangeStartMillis=\d+/, 'ExSDRange.RangeStartMillis=' + startMs);
                else out += (out.includes('?') ? '&' : '?') + 'ExSDRange.RangeStartMillis=' + startMs;
                if (/ExSDRange\.RangeEndMillis=\d+/.test(out)) out = out.replace(/ExSDRange\.RangeEndMillis=\d+/, 'ExSDRange.RangeEndMillis=' + endMs);
                else out += '&ExSDRange.RangeEndMillis=' + endMs;
                return out;
            }
        }
        // v11.56: aynı sorguya start (offset) ekle — pagination "next" linki bulunamazsa
        //   sunucu start= ile sayfalama yapıyorsa 999 cap'ini aşmak için kullanılır.
        function tSetStart(url, start) {
            try {
                const u = new URL(url, location.href);
                u.searchParams.set('start', String(start));
                if (!u.searchParams.has('size')) u.searchParams.set('size', '2000');
                return u.toString();
            } catch {
                let out = url;
                if (/[?&]start=\d+/.test(out)) out = out.replace(/([?&]start=)\d+/, '$1' + start);
                else out += (out.includes('?') ? '&' : '?') + 'start=' + start;
                return out;
            }
        }
        // v11.56: URL'ye size=N ekle (yoksa) — path A (özet linki) için
        function tEnsureSize(url, n) {
            try {
                const u = new URL(url, location.href);
                if (!u.searchParams.has('size')) u.searchParams.set('size', String(n || 2000));
                return u.toString();
            } catch {
                return /[?&]size=\d+/.test(url) ? url : url + (url.includes('?') ? '&' : '?') + 'size=' + (n || 2000);
            }
        }
        // v11.59: B yolu için SIFIRDAN temiz ItemList URL — kazınmış linkteki gizli
        //   varsayılan aralık/filtre (örn. [şimdi, +3gün]) leak'ini ELER. Sadece bu CPT'nin
        //   ExSD aralığı + WorkPool=PickingPickedInTransit. Servis-sınıfı kısıtı YOK → tüm transit.
        //   Uzak gelecek CPT'lerin (+4/+5 gün) tote'larını da getirir.
        function tBuildCleanItemListUrl(startTs, endTs) {
            let base;
            try { base = new URL('ItemList', location.href).toString(); }
            catch { base = String(location.href).replace(/\/[^/?#]*([?#].*)?$/, '/ItemList'); }
            const params = [
                '_enabledColumns=on',
                'WorkPool=PickingPickedInTransit',
                'FulfillmentServiceClass=FASTTRACK',   // v11.61 KRİTİK: bu olmadan ItemList uzak tarihte 0 döner. FASTTRACK = servis sınıfı, içinde Single→Multi tüm process path'ler var.
                // v12.06: ATLAS Bridge'in KANITLANMIŞ kolonları. Eskiden LPN/PROCESS_PATH/
                //   PICK_BATCH_ID de eklenince Rodeo 0 SATIR döndürüyordu (fazla kolon = boş sonuç).
                //   ATLAS sadece DEMAND_ID + ASIN_TITLES + OUTER_SCANNABLE_ID kullanıyor ve çalışıyor.
                //   PROCESS_PATH/PICK_BATCH_ID kolonsuz da gelir (parser td index'ten değil header'dan
                //   okuyor, eksikse boş geçer). Kat tahmini FC Research'ten zaten geliyor.
                'enabledColumns=DEMAND_ID',
                'enabledColumns=ASIN_TITLES',
                'enabledColumns=OUTER_SCANNABLE_ID',
                'enabledColumns=PROCESS_PATH',     // v12.06: pathGroup (MMZ/SNS/SM rozeti) için — ATLAS'ta yok ama bizde rozet var
                'enabledColumns=PICK_BATCH_ID',    // v12.06: Sortation eşleştirmesi için
                'shipmentType=CUSTOMER_SHIPMENTS',
                'ExSDRange.RangeStartMillis=' + startTs,
                'ExSDRange.RangeEndMillis=' + endTs,
                'size=3000'             // v11.77: 2000→3000 — orta-yoğun günde tek sayfada biter, ~%40 daha hızlı tarama
            ];
            return base + '?' + params.join('&');
        }
        // CPT hücresi + SORGU GÜNÜ → tam tarih cpt. TARİH sorgu gününden (otoriter), SAAT hücreden.
        function tCptForDay(exsdTxt, dayDate) {
            const m = String(exsdTxt || '').match(/(\d{1,2}):(\d{2})/);
            if (!m) return { cpt:'', cptTs:null };
            const dt = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), +m[1], +m[2], 0, 0);
            return { cpt: tFmtCptKey(dt.getTime()), cptTs: dt.getTime() };
        }

        // ExSD link → ItemList href seç (customer_shipments + workPool öncelikli)
        function tPickItemListHref(doc, workPoolLower) {
            const links = Array.from(doc.querySelectorAll('a[href*="ItemList"]'));
            if (!links.length) return '';
            const wp = String(workPoolLower || '').toLowerCase();
            for (const a of links) {
                const href = a.getAttribute('href') || '';
                const h = href.toLowerCase();
                if (!h.includes('itemlist')) continue;
                if (!h.includes('shipmenttype=customer_shipments')) continue;
                if (wp && !h.includes('workpool=' + wp)) continue;
                return href;
            }
            // fallback: sadece workpool eşleşmesi
            if (wp) for (const a of links) {
                const href = a.getAttribute('href') || '';
                const h = href.toLowerCase();
                if (h.includes('itemlist') && h.includes('workpool=' + wp)) return href;
            }
            return '';
        }

        function tEnsureHotpickColumns(url) {
            if (!url) return '';
            try {
                const u = new URL(url);
                if (!u.searchParams.has('_enabledColumns')) u.searchParams.set('_enabledColumns','on');
                for (const c of ['DEMAND_ID','ASIN_TITLES','LPN','OUTER_SCANNABLE_ID']) {
                    if (!u.searchParams.getAll('enabledColumns').includes(c)) u.searchParams.append('enabledColumns', c);
                }
                return u.toString();
            } catch { return url; }
        }

        // ItemList sayfası parse — tablo header'larından kolon indexleri çıkar, satırları al
        function tCi(L, t) { for (let i=0;i<L.length;i++) for (const s of t) if (L[i].includes(s)) return i; return -1; }
        function tParsePage(html, baseUrl) {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const rows = [];
            const tables = doc.getElementsByTagName('table');
            for (let t = 0; t < tables.length; t++) {
                const trs = tables[t].getElementsByTagName('tr');
                let hdrIdx = -1, L = null;
                for (let r = 0; r < trs.length; r++) {
                    const cells = trs[r].querySelectorAll('th,td');
                    if (cells.length < 4) continue;
                    const labels = []; for (let c = 0; c < cells.length; c++) labels.push(tClean(cells[c].textContent).toLowerCase());
                    let hasDwell = false, hasScan = false;
                    for (const lab of labels) { if (lab.includes('dwell')) hasDwell = true; if (lab.includes('scannable')) hasScan = true; }
                    if (hasDwell && hasScan) { hdrIdx = r; L = labels; break; }
                }
                if (hdrIdx < 0 || !L) continue;
                const iS = tCi(L, ['scannable id','scannable']);
                const iD = tCi(L, ['dwell']);
                const iE = tCi(L, ['expected ship date','expected ship','exsd','need to ship','needtoship','expected','promise date']);
                const iP = tCi(L, ['process path','process']);
                const iQ = tCi(L, ['quantity','qty']);
                const iB = tCi(L, ['pick batch','pickbatch','batch id','batchid']);
                const iO = tCi(L, ['outer scannable']);
                const iDM = tCi(L, ['demand id','demandid','demand']);
                const iSH = tCi(L, ['shipment id','shipmentid','shipment']);
                const iFN = tCi(L, ['fn sku','fnsku','sku']);
                if (iS < 0 || iD < 0) continue;
                const minCols = Math.max(iS, iD) + 1;
                for (let r = hdrIdx + 1; r < trs.length; r++) {
                    const td = trs[r].getElementsByTagName('td');
                    if (td.length < minCols) continue;
                    const id = tClean(td[iS]?.textContent);
                    if (!id) continue;
                    // v11.64: dwell hücresinde sayı hem <span class="dwell-time-minutes"> hem düz metinde olabilir
                    //   (örn "<span>10</span>10m" → textContent "1010m"). Önce span'i dene, yoksa düz metin.
                    let dwellRaw = '';
                    const dwTd = td[iD];
                    const dwSpan = (dwTd && dwTd.querySelector) ? dwTd.querySelector('.dwell-time-minutes') : null;
                    dwellRaw = dwSpan ? dwSpan.textContent : (dwTd ? dwTd.textContent : '');
                    rows.push({
                        toteId: id,
                        exsd: iE >= 0 ? tClean(td[iE]?.textContent) : '',
                        dwellMinutes: Math.floor(tParseDwell(tClean(dwellRaw))),
                        pathGroup: iP >= 0 ? tClean(td[iP]?.textContent).replace(/^PP\s*/i,'') : '',
                        qty: iQ >= 0 ? (parseInt(tClean(td[iQ]?.textContent)) || 0) : 0,
                        batchId: iB >= 0 ? tClean(td[iB]?.textContent) : '',
                        outerScannable: iO >= 0 ? tClean(td[iO]?.textContent) : '',
                        demandId: iDM >= 0 ? tClean(td[iDM]?.textContent) : '',
                        shipmentId: iSH >= 0 ? tClean(td[iSH]?.textContent) : '',
                        fnSku: iFN >= 0 ? tClean(td[iFN]?.textContent) : ''
                    });
                }
                break;
            }
            // v11.56: ROBUST "sonraki sayfa" tespiti — metin (next/»/›/→/>>/sonraki/more)
            //   VEYA href'te start= değeri mevcuttan büyük olan EN KÜÇÜK ileri link.
            let next = '';
            const anchors = doc.getElementsByTagName('a');
            const curStart = (() => { const m = String(baseUrl).match(/[?&]start=(\d+)/); return m ? +m[1] : 0; })();
            let fwdStart = -1, fwdHref = '';
            for (let i = 0; i < anchors.length; i++) {
                const txt = tClean(anchors[i].textContent);
                const href = anchors[i].getAttribute('href') || '';
                const okHref = href && !/^#/.test(href) && !/^javascript:/i.test(href);
                if (okHref && /^(next|sonraki|more|»|›|→|>>|>)/i.test(txt)) { next = tAbs(baseUrl, href); break; }
                const ms = href.match(/[?&]start=(\d+)/);
                if (ms) { const s = +ms[1]; if (s > curStart && (fwdStart < 0 || s < fwdStart)) { fwdStart = s; fwdHref = href; } }
            }
            if (!next && fwdHref) next = tAbs(baseUrl, fwdHref);
            // v11.65: "Showing 1 - X of Y results" → toplam satır (sayfalama tamamlığı için)
            let total = -1;
            try {
                const bt = (doc.body ? doc.body.textContent : '') || '';
                const tm = bt.match(/of\s+([\d.,]+)\s+result/i);
                if (tm) total = parseInt(tm[1].replace(/[.,]/g, '')) || -1;
            } catch (e) {}
            return { rows, next, total };
        }

        // FC Research — tote → employee/lastPick (host: fcresearch-eu.aka.amazon.com)
        // v12.55: BİRİNCİL — kullanıcının gerçekte baktığı sayfa (adres çubuğundan birebir):
        //   qi-fcresearch-eu.corp.amazon.com/IST2/results?s=<tote>
        //   EN YENİ işlemler burada. Eski tBuildFcUrl ('-more?token=' ucu) SAYFALAMA ucudur:
        //   devam/ESKİ satır bloklarını döndürür → "çok eski veriyi çekiyor" şikayetinin kök sebebi.
        //   O uç artık yalnızca yedek (ana sayfa ağ hatası verirse).
        const TR_FC_HOST_PRIMARY = 'https://qi-fcresearch-eu.corp.amazon.com/';
        function tBuildFcPageUrl(toteId) {
            return TR_FC_HOST_PRIMARY + TR_FC + '/results?s=' + encodeURIComponent(toteId);
        }
        function tBuildFcUrl(toteId) {
            const t1 = Math.floor(Date.now() / 1000), t2 = t1 - TR_FC_HOURS * 3600;
            return 'https://fcresearch-eu.aka.amazon.com/' + TR_FC +
                '/results/inventory-history-more?token={"request":{"warehouseId":"' + TR_FC +
                '","searchString":"' + toteId + '","startSearchDateUtc":' + t2 +
                ',"endSearchDateUtc":' + t1 + ',"nextToken":"{\\"query\\":{\\"containerScannableId\\":\\"' +
                toteId + '\\",\\"warehouseId\\":\\"' + TR_FC + '\\",\\"startRange\\":' + t2 +
                ',\\"endRange\\":' + t1 + '},\\"firstResult\\":0,\\"hasNext\\":true,\\"isSourceContainerSearchComplete\\":true}"},"totalRecordCount":1}';
        }
        // Gerçek pick aisle lokasyonu mu? (örn. "P-1-B281A234")
        // Buffer/sortation lokasyonlarını eler: rbMMZ..., tspsOBColl..., chPSMAINW... vs.
        function tIsRealPickLocation(s) {
            if (!s) return false;
            const t = String(s).trim();
            // P-N-... (örn. P-1-B281A234, P-5-A284A374) — gerçek pick aisle
            return /^P-\d+-[A-Z0-9]/i.test(t);
        }
        function tParseFcResponse(html, toteId) {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            let employee = '', lastPick = '', recentLoc = '';
            const _isToteId = s => /^ts[A-Za-z0-9]{6,}$/i.test(String(s||''));

            // ═══ v12.53 BİRİNCİL KAYNAK: ENVANTER GEÇMİŞİ ("Atlas mantığı", kullanıcı kuralı) ═══
            //   LOKASYON = tote'a yapılan EN SON alımın KAYNAĞI. En yeni satır:
            //     Yeni Kutu == toteId  VE  Eski Kutu == gerçek pick lokasyonu (P-X-...)
            //     → lastPick = Eski Kutu · picker = o satırın Kişi'si · kat = P-N'den.
            //   Konteyner tahmini ve workforce, LOKASYON için ARTIK KULLANILMAZ; kutu-geçmişi
            //   tablosu bulunduğu halde alım satırı yoksa LOKASYON boş kalır ("—"), yanlış yazmaz.
            //   Başlıklar TR/EN: Kişi|Person|User, Eski Kutu|Eski Konteyner|Old/From Container,
            //   Yeni Kutu|Yeni Konteyner|New/To/Destination Container.
            //   GÜNCEL KONTEYNER (v11.66 hybrid/staging düşürme İÇİN KORUNUR): en yeni satır
            //     Eski Kutu == toteId → Yeni Kutu (tote'tan son çıkışın hedefi).
            let _histHit = false, _histTable = false, _histFloor = 0, _histLoc = '', _histCur = '';
            try {
                const _tid = String(toteId || '').trim().toLowerCase();
                const _mIdx = (labels, res) => { for (let i = 0; i < labels.length; i++) for (const re of res) if (re.test(labels[i])) return i; return -1; };
                for (const table of doc.querySelectorAll('table')) {
                    let hdr = null;
                    for (const tr of table.querySelectorAll('tr')) {
                        const ths = [...tr.querySelectorAll('th')];
                        if (ths.length) { hdr = ths.map(th => tClean(th.textContent).toLowerCase()); break; }
                    }
                    if (!hdr) continue;
                    const iOld = _mIdx(hdr, [/eski\s*(kutu|kont)/, /(old|from|source)\s*container/, /^from$/]);
                    const iNew = _mIdx(hdr, [/yeni\s*(kutu|kont)/, /(new|to|destination|hedef)\s*container/, /^to$/, /hedef\s*(kutu|kont)/]);
                    if (iOld < 0 || iNew < 0) continue;
                    _histTable = true;
                    const iPer = _mIdx(hdr, [/kişi|kisi/, /person/, /^user/, /employee/, /associate/, /login/]);
                    let rows = [...table.querySelectorAll('tbody tr')];
                    if (!rows.length) rows = [...table.querySelectorAll('tr')].slice(1);
                    // v12.55: "tarihe göre sıraladığında EN SON işlem" (kullanıcı kuralı) —
                    //   DOM sırasına güvenme: data-row-id (ISO) ya da ilk hücredeki tarih
                    //   metninden zaman çıkar, EN YENİ ÜSTTE olacak şekilde kendimiz sırala.
                    const _rowTs = row => {
                        try {
                            const rid = row.getAttribute && row.getAttribute('data-row-id');
                            if (rid) { const t = Date.parse(rid); if (!isNaN(t)) return t; }
                            const ftd = row.querySelector && row.querySelector('td');
                            const m = ftd && tClean(ftd.textContent).match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(:\d{2})?)/);
                            if (m) { const t = Date.parse(m[1] + 'T' + m[2]); if (!isNaN(t)) return t; }
                        } catch (e) {}
                        return null;
                    };
                    if (rows.some(r => _rowTs(r) !== null)) {
                        rows = rows.map((r, i) => ({ r, i, ts: _rowTs(r) }))
                                   .sort((a, b) => (b.ts ?? -1) - (a.ts ?? -1) || a.i - b.i)
                                   .map(x => x.r);
                    }
                    for (const row of rows) {   // en yeni satır üstte (tarih sıralı ya da FC sırası)
                        const tds = [...row.querySelectorAll('td')];
                        if (tds.length <= Math.max(iOld, iNew)) continue;
                        const oldC = tClean(tds[iOld]?.textContent);
                        const newC = tClean(tds[iNew]?.textContent);
                        if (!_histHit && _tid && newC.toLowerCase() === _tid && tIsRealPickLocation(oldC)) {
                            _histHit = true; _histLoc = oldC;
                            const fm = oldC.match(/P-?([1-6])-/i);
                            if (fm) _histFloor = parseInt(fm[1]);
                            if (iPer >= 0) { const p = tClean(tds[iPer]?.textContent); if (p && !_isToteId(p)) employee = p; }
                        }
                        if (!_histCur && _tid && oldC.toLowerCase() === _tid && newC && newC !== '-' && newC !== '—' && !_isToteId(newC)) {
                            _histCur = newC;
                        }
                        if (_histHit && _histCur) break;
                    }
                    if (_histHit || _histCur) break;
                }
            } catch (e) {}
            if (_histHit) lastPick = _histLoc;
            if (_histCur) recentLoc = _histCur;
            for (const table of doc.querySelectorAll('table')) {
                // Header satırından kolon indexlerini bul
                let headerTr = null, L = null;
                for (const tr of table.querySelectorAll('tr')) {
                    const ths = [...tr.querySelectorAll('th')];
                    if (!ths.length) continue;
                    const labels = ths.map(th => tClean(th.textContent).toLowerCase());
                    const iE = tCi(labels, ['employee','associate','user','login','picker']);
                    const iL = tCi(labels, ['lastpick','last pick','pick location','location']);
                    if (iE >= 0 && iL >= 0) { headerTr = tr; L = labels; break; }
                }
                if (!headerTr || !L) continue;
                const iE = tCi(L, ['employee','associate','user','login','picker']);
                const iL = tCi(L, ['lastpick','last pick','pick location','location']);
                // v10.73: hedef/yeni konteyner kolonu (taşınmış tote'un GÜNCEL konumu)
                let iC = tCi(L, ['yeni konteyner','new container','destination container','hedef konteyner','to container']);
                if (iC < 0) iC = tCi(L, ['container','konteyner']);

                // Tüm tbody satırlarını gez — gerçek pick lokasyonu olanı bul
                const bodyRows = [...table.querySelectorAll('tbody tr')];
                for (const row of bodyRows) {
                    const tds = [...row.querySelectorAll('td')];
                    if (tds.length <= Math.max(iE, iL)) continue;
                    const emp = tClean(tds[iE]?.textContent);
                    const loc = tClean(tds[iL]?.textContent);
                    // İlk satırdaki employee'yi al (genelde en son toplayan)
                    if (!employee && emp) employee = emp;
                    // Gerçek pick lokasyonu mu? (P-X-...)
                    if (!lastPick && tIsRealPickLocation(loc)) {
                        lastPick = loc;
                    }
                    // v10.73: En güncel konum (ilk satır) — pick formatı ŞART DEĞİL.
                    // Taşınmış/karta geçmiş tote için "Yeni Konteyner" ya da location değeri
                    // (örn. cvAtPM00002, pmP-6-A). lastPick bulunamazsa lokasyon olarak kullanılır.
                    if (!recentLoc) {
                        const cand = (iC >= 0 ? tClean(tds[iC]?.textContent) : '') || loc;
                        if (cand && cand !== '-' && cand !== '—' && !_isToteId(cand)) recentLoc = cand;
                    }
                    // Hepsi bulundu, çık
                    if (employee && lastPick && recentLoc) break;
                }
                if (employee || lastPick) break;
            }
            // Fallback: ilk tbody satırı (eski mantık) — sadece employee için
            if (!employee) {
                const row = doc.querySelector('table tbody tr');
                if (row) {
                    const tds = row.querySelectorAll('td');
                    employee = tClean(tds[8]?.textContent);
                    // Fallback'te de lokasyonu kontrol et — gerçekse al, değilse boş bırak
                    const loc = tClean(tds[9]?.textContent);
                    if (!lastPick && tIsRealPickLocation(loc)) lastPick = loc;
                    if (!recentLoc && loc && loc !== '-' && loc !== '—' && !_isToteId(loc)) recentLoc = loc;
                }
            }
            // v11.69: TOTE'un KENDİ katı — KAP GEÇMİŞİ tablosundaki KONTEYNER hücrelerinden
            //   (Eski/Yeni Konteyner) floor-format al (ör. "pmP-1-B" → kat 1). Picker'ın pick
            //   lokasyonu (örn. "P-3-A254A312") DEĞİL — picker başka kata geçince tote onun
            //   katını gösteriyordu. Tote'un fiziksel konteyner katı esas.
            let fcFloor = _histFloor, floorLoc = _histLoc, _floorFromContainer = false, _containerMover = '';
            // v12.53: kutu-geçmişi tablosu ANLAŞILDIYSA (_histTable) eski konteyner taraması
            //   ATLANIR — o tarama tote'la ilgisiz satırlardan P-N yakalayıp yanlış kat verebiliyordu.
            if (!_histHit && !_histTable) try {
                // 1) KAP GEÇMİŞİ: "konteyner"/"container" başlıklı kolonların hücrelerinde ara.
                //    En güncel satır önce → ilk floor-format konteyner = tote'un son katlı konumu.
                //    Aynı satırın "Tarafından Taşındı" (mover) hücresini de al → CANLI picker.
                for (const table of doc.querySelectorAll('table')) {
                    const ths = [...table.querySelectorAll('tr th')];
                    if (!ths.length) continue;
                    const hl = ths.map(th => tClean(th.textContent).toLowerCase());
                    const contCols = [];
                    hl.forEach((h, i) => { if (/konteyner|container/.test(h)) contCols.push(i); });
                    if (!contCols.length) continue;
                    // mover kolonu: "Tarafından Taşındı" / "Moved By" (— "Müşteri Tarafından" DEĞİL)
                    let moverCol = -1;
                    hl.forEach((h, i) => { if (moverCol < 0 && /taşındı|moved\s*by/.test(h) && !/müşteri|customer/.test(h)) moverCol = i; });
                    let rows = [...table.querySelectorAll('tbody tr')];
                    if (!rows.length) rows = [...table.querySelectorAll('tr')].slice(1);
                    for (const row of rows) {
                        const tds = [...row.querySelectorAll('td')];
                        for (const ci of contCols) {
                            const cv = tClean(tds[ci]?.textContent);
                            const fm = cv && cv.match(/P-?([1-6])-/i);
                            if (fm) {
                                fcFloor = parseInt(fm[1]); floorLoc = cv; _floorFromContainer = true;
                                if (moverCol >= 0) _containerMover = tClean(tds[moverCol]?.textContent);
                                break;
                            }
                        }
                        if (fcFloor) break;
                    }
                    if (fcFloor) break;
                }
                // 2) Konteynerde floor-format yoksa → eski davranış (tüm td'lerde ilk "P-N-")
                if (!fcFloor) {
                    for (const td of doc.querySelectorAll('td')) {
                        const ct = tClean(td.textContent);
                        if (!ct || ct.length > 40) continue;       // uzun metinleri atla
                        const fm = ct.match(/P-?([1-6])-/i);       // "pmP-2-B", "P-3-A..." vb.
                        if (fm) { fcFloor = parseInt(fm[1]); floorLoc = ct; break; }
                    }
                }
            } catch (e) {}
            // Konteyner katı bulunduysa LOKASYON da o konteyner olsun — picker'ın pick
            // lokasyonunu EZ (tote fiziksel olarak o konteynerde, picker'ın yanında değil).
            // v12.53: alım satırı yok ama tote'un son çıkışı katlı konteynerdeyse (örn. pmP-2-B)
            //   KAT oradan alınır — LOKASYON boş kalır (lokasyon yalnızca alım kaynağı olabilir).
            if (!fcFloor && _histTable && _histCur) {
                const _fm2 = _histCur.match(/P-?([1-6])-/i);
                if (_fm2) { fcFloor = parseInt(_fm2[1]); floorLoc = _histCur; }
            }
            if (_floorFromContainer && floorLoc && !_histTable) lastPick = floorLoc;   // v12.53: kutu-geçmişi varken LOKASYON konteynerle EZİLMEZ
            // v11.70: picker de EN GÜNCEL konteyner hareketinin taşıyanı olsun (kat ile tutarlı,
            //   canlı). Login gibi görünüyorsa (tote-id değil, makul uzunlukta) eski picker'ı ez.
            if (_floorFromContainer && _containerMover && !_histTable && !_isToteId(_containerMover) && /^[A-Za-z][A-Za-z0-9._-]{2,}$/.test(_containerMover)) {
                employee = _containerMover;   // v12.53: kutu-geçmişi varken picker alım satırından gelir, mover ezmez
            }
            return { employee, lastPick, recentLoc, fcFloor, floorLoc };
        }
        // v12.54: ÇOKLU ARAMA yanıtı çözücü — satır başına bir scannable.
        //   Her tabloda: satır, istenen tote ID'lerinden birini içeriyorsa o tote'undur. Satırdan:
        //     lokasyon = tIsRealPickLocation geçen İLK hücre (P-X-...; buffer/konteyner ASLA
        //       lokasyon yazılmaz — v12.53 "Atlas kuralı" ile uyumlu, yanlış lokasyon üretmez)
        //     picker   = login desenli ilk hücre (tote/lokasyon/sayı/etiket-kelimesi değil)
        //     güncel konteyner = konteynerimsi ilk hücre (rbMMZ..., tcSTAGING01 — hybrid düşürme için)
        function tParseFcBulkList(html, ids) {
            const out = {};
            try {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const wanted = new Map(); (ids || []).forEach(id => wanted.set(String(id).toLowerCase(), id));
                const _isToteId2 = s => /^ts[A-Za-z0-9]{6,}$/i.test(String(s || ''));
                const _STOP = /^(pallet|tote|case|bin|type|status|detail|details|history|action|actions|view|open|missing|missed|picked|buffered|scannable|location|container|user|none|null|true|false)$/i;
                // v12.54: login = TAMAMEN küçük harf + 3 ardışık rakam yok (Amazon login biçimi).
                //   Konteynerler (rbMMZ0012B07, tcSTAGING01, cvAtPM00002) büyük harf/rakam dizisi
                //   içerdiğinden login sanılmaz.
                const _isLogin = s => /^[a-z][a-z0-9._-]{2,15}$/.test(String(s || '')) && !/\d{3,}/.test(String(s || '')) && !_isToteId2(s) && !_STOP.test(String(s || ''));
                for (const table of doc.querySelectorAll('table')) {
                    let rows = [...table.querySelectorAll('tbody tr')];
                    if (!rows.length) rows = [...table.querySelectorAll('tr')].slice(1);
                    for (const row of rows) {
                        const cells = [...row.querySelectorAll('td')].map(td => tClean(td.textContent));
                        if (!cells.length) continue;
                        let tid = null;
                        for (const c of cells) { const k = c.toLowerCase(); if (wanted.has(k)) { tid = wanted.get(k); break; } }
                        if (!tid) {
                            const rt = (row.textContent || '').toLowerCase();
                            for (const [k, orig] of wanted) { if (rt.includes(k)) { tid = orig; break; } }
                        }
                        if (!tid || out[tid]) continue;
                        let lastPick = '', employee = '', recentLoc = '';
                        for (const c of cells) { if (!lastPick && tIsRealPickLocation(c)) { lastPick = c; break; } }
                        for (const c of cells) {
                            if (employee) break;
                            if (_isLogin(c) && c.toLowerCase() !== tid.toLowerCase() && !tIsRealPickLocation(c)) employee = c.toLowerCase();
                        }
                        for (const c of cells) {
                            if (recentLoc) break;
                            if (!c || c === '-' || c === '—') continue;
                            if (c.toLowerCase() === tid.toLowerCase() || _isToteId2(c)) continue;
                            if (tIsRealPickLocation(c) || _STOP.test(c)) continue;
                            // konteynerimsi: harfle başlar, İÇİNDE rakam var, boşluksuz (rbMMZ0012B07, tcSTAGING01)
                            if (/^[A-Za-z][A-Za-z0-9._-]{4,}$/.test(c) && /[0-9]/.test(c)) recentLoc = c;
                        }
                        const fm = lastPick.match(/P-?([1-6])-/i);
                        const fcFloor = fm ? parseInt(fm[1]) : 0;
                        if (lastPick || employee || recentLoc || fcFloor) out[tid] = { employee, lastPick, recentLoc, fcFloor, floorLoc: lastPick };
                    }
                }
            } catch (e) {}
            return out;
        }

        // v11.80: FC fetch hata istatistiği — TIMEOUT/network hataları sessizce yutulurdu, artık sayılır
        let _fcStats = { ok: 0, err: 0, lastErr: '' };
        async function tFetchEmployee(toteId) {
            // v12.55: BİRİNCİL = gerçek sayfa (qi-...corp/results?s=) — en yeni işlemler.
            //   200 dönerse sonucu (boş bile olsa) ona göre değerlendiririz; ağ hatasında
            //   eski '-more' ucu YEDEK olarak denenir. İkisi de düşerse _err (neg-cache yazılmaz).
            try {
                const r = await trGet(tBuildFcPageUrl(toteId), TR_FC_TIMEOUT_MS);
                if (r && r.status === 200) { _fcStats.ok++; return tParseFcResponse(r.responseText, toteId); }
                _fcStats.err++;
                _fcStats.lastErr = 'HTTP ' + (r && r.status || '?') + ' (ana sayfa)';
            } catch (e) {
                _fcStats.err++;
                _fcStats.lastErr = String(e && e.message || e).slice(0, 80);
            }
            try {
                const r2 = await trGet(tBuildFcUrl(toteId), TR_FC_TIMEOUT_MS);
                if (r2 && r2.status === 200) { _fcStats.ok++; return tParseFcResponse(r2.responseText, toteId); }
            } catch (e2) {}
            // v12.54: _err — bu bir AĞ HATASI (timeout/HTTP), "FC'de kayıt yok" DEĞİL.
            return { employee:'', lastPick:'', recentLoc:'', fcFloor:0, floorLoc:'', _err: true };
        }

        // Employee cache (localStorage TTL'li)
        function tLoadEmpCache() { try { return JSON.parse(localStorage.getItem(TR_EMP_CACHE_KEY)) || {}; } catch { return {}; } }
        function tSaveEmpCache(c) {
            try {
                const keys = Object.keys(c);
                if (keys.length > 5000) {
                    const sorted = keys.sort((a,b)=>(c[a].ts||0)-(c[b].ts||0));
                    for (const k of sorted.slice(0, keys.length-4000)) delete c[k];
                }
                localStorage.setItem(TR_EMP_CACHE_KEY, JSON.stringify(c));
            } catch { try { localStorage.removeItem(TR_EMP_CACHE_KEY); } catch {} }
        }
        function tIsCacheFresh(e) { if (!e || !e.ts) return false; return (Date.now()-e.ts) <= (e.neg ? TR_EMP_NEG_TTL : TR_EMP_CACHE_TTL); }

        // Stream pages — sayfa sayfa "next" linkini takip eder; 3 retry × 15s timeout; prefetch ile bir sonraki paralelde
        async function tStreamPages(startUrl, onPage, expectedTotal) {
            // v12.21: expectedTotal = beklenen satır/birim sayısı (wide query'de özet grandTotal).
            //   KÖK SEBEP FİX: Rodeo ItemList bazen ilk sayfayı EKSİK döndürüyor — az satır (örn 33)
            //   + "of N results" toplamını VERMİYOR. Eski mantık: toplam yoksa "sayfa dolu mu?" diye
            //   rows.length>=900 bakıyordu. 33<900 → "son sayfa" sanıp DURUYORDU → 4 tote bug'ı.
            //   Kullanıcı: "durduk yere 4 tote geliyor sonra düzeliyor." ÇÖZÜM: expectedTotal biliniyorsa
            //   ve çektiğimiz ondan çok azsa → next linki/toplam olmasa bile offset ile DEVAM et.
            let url = startUrl, pg = 0;
            let prefetch = null, prefetchUrl = null;
            let hadError = false;
            let cumRows = 0;          // v11.56: offset fallback için toplam satır
            let prevSig = '';         // v11.56: aynı sayfa tekrarını tespit et
            let pageTotal = -1;       // v11.65: "of N results" → beklenen toplam satır
            while (url && pg < TR_MAX_PAGES) {
                pg++;
                let r = null;
                if (prefetch && prefetchUrl === url) {
                    try { r = await prefetch; if (!r || r.status !== 200) r = null; } catch { r = null; }
                    prefetch = null; prefetchUrl = null;
                }
                if (!r) {
                    for (let attempt = 0; attempt < 3; attempt++) {
                        try {
                            r = await trGet(url, TR_PAGE_TIMEOUT_MS);
                            if (r && r.status === 200) break;
                            r = null;
                        } catch { r = null; }
                        if (attempt < 2) await tDelay(300 + attempt * 400);
                    }
                    if (!r) { hadError = true; break; }
                }
                const { rows, next, total } = tParsePage(r.responseText, url);
                if (total > 0) pageTotal = total;              // v11.65: sayfadan toplam
                if (!rows.length && pg === 1) { hadError = true; break; }
                // v11.56: sayfa imzası — offset fallback aynı sayfayı tekrar çekerse dur
                const sig = rows.length + '|' + ((rows[0] && rows[0].toteId) || '') + '|' + ((rows[rows.length - 1] && rows[rows.length - 1].toteId) || '');
                if (pg > 1 && sig === prevSig) break;
                prevSig = sig;
                cumRows += rows.length;
                // v11.65: sonraki sayfa — önce GERÇEK next; yoksa DAHA SATIR VARSA offset fallback.
                //   "daha satır var mı": toplam biliniyorsa cumRows<toplam; bilinmiyorsa sayfa doluysa.
                // v12.21: ÜÇÜNCÜ koşul — expectedTotal (özet) biliniyorsa ve çektiğimiz ondan ciddi
                //   AZSA, "of N results" metni gelmese bile DEVAM et. Rodeo ilk sayfayı eksik döndürüp
                //   toplamı gizlediğinde erken durmayı engeller (4-tote bug'ının asıl fix'i).
                //   Eşik 900→400: sayfa boyutu size=3000 ama Rodeo bazen ~500 satırlık sayfa döndürür,
                //   900 eşiği bunları "son sayfa" sanıyordu. 400 daha güvenli (kısmi sayfada bile devam).
                const _expectMore = expectedTotal > 0 && cumRows < expectedTotal * 0.9;
                const moreExpected = (pageTotal > 0) ? (cumRows < pageTotal) : (rows.length >= 400 || _expectMore);
                let nextUrl = (next && next !== url) ? next : '';
                if (!nextUrl && moreExpected) nextUrl = tSetStart(startUrl, cumRows);
                // gerçek next'i prefetch et (offset fallback prefetch edilmez)
                if (next && next !== url && pg < TR_MAX_PAGES) {
                    prefetchUrl = next;
                    prefetch = trGet(next, TR_PAGE_TIMEOUT_MS).catch(()=>null);
                }
                const cont = onPage(rows, pg, !!nextUrl);
                if (cont === false) break;
                if (!nextUrl || nextUrl === url) break;
                url = nextUrl;
            }
            return { pages: pg, error: hadError, rows: cumRows, total: pageTotal };
        }

        // Concurrency pool
        async function tPool(items, limit, fn) {
            let i = 0; const len = items.length;
            if (!len) return;
            await Promise.all(Array.from({ length: Math.min(limit, len) }, async () => {
                while (i < len) { const idx = i++; try { await fn(items[idx]); } catch {} }
            }));
        }

        // CPT v10 formatına çevir + GM/localStorage'a yaz
        // v12.05: Flush dedup için closure scope'lu imza
        let _lastTBuildFlushSig = '';
        function tBuildAndFlush(allRows, hotpickIds, empMap, cptTotalsObj, enriching, progress) {
            // ÖNCEKİ DURUMU OKU — lokasyon/picker bilgilerini yeni totes'a merge etmek için
            // Bu sayede tam fetch sırasında lokasyon/picker bilgisi kaybolmaz.
            // v10.48: Tek cache (cpt_transit_batches_v9) — normal + Fracs aynı cache'i paylaşır.
            //   Diğer sayfanın tote'larını silmemek için cross-page merge yapılır (aşağıda).
            const prev = (function() {
                try {
                    const r = localStorage.getItem('cpt_transit_batches_v9');
                    return r ? (JSON.parse(r).data || JSON.parse(r)) : null;
                } catch { return null; }
            })();
            const prevTotes = (prev && prev.totes) || {};

            const totes = {};
            for (const r of allRows) {
                if (!r.toteId) continue;
                if (!totes[r.toteId]) {
                    // v11.53: gün-gün modda satıra cpt önceden atanır (sorgu gününe sabit). Yoksa hücreden çöz.
                    const _cc = (r.cpt != null) ? { cpt: r.cpt, cptTs: r.cptTs } : tParseCptCell(r.exsd);
                    // v12.01: dwellStartMs — dwell süresinin BAŞLADIĞI zaman. HTML render'ı bunu
                    //   kullanarak CANLI dwell hesaplar (Date.now() - dwellStartMs). Önceki taramada
                    //   varsa o zamanı koru → 60sn refresh'te dwell sıçramaz, akıcı artar.
                    const _prevTote = prevTotes[r.toteId];
                    const _dwellStartMs = _prevTote && _prevTote.dwellStartMs
                        ? _prevTote.dwellStartMs                                    // önceki taramadan koru
                        : Date.now() - ((r.dwellMinutes || 0) * 60000);             // ilk gördüğümüz an
                    totes[r.toteId] = {
                        scannableId: r.toteId,
                        cpt: _cc.cpt, cptTs: _cc.cptTs,
                        totalQty: 0,
                        lineCount: 0,
                        maxDwell: 0,
                        dwellStartMs: _dwellStartMs,  // v12.01: canlı dwell için sabit başlangıç
                        fcFloor: 0,                // v10.86: tote'un KENDİ katı (FC Research)
                        pathGroup: r.pathGroup || '',
                        location: '',
                        curContainer: '',          // v11.66: tote'un GÜNCEL konteyneri (FC Research "Yeni Konteyner")
                        lastPicker: '',
                        batchId: r.batchId || '',  // v10.43: Sortation eşleştirmesi için
                        isFracs: IS_EXSD_FRACS,    // v10.48: Bu sayfa Fracs Rodeo ise true
                        isHotpick: hotpickIds && hotpickIds.has(r.toteId)
                    };
                }
                const t = totes[r.toteId];
                t.totalQty += (r.qty || 0);
                t.lineCount++;
                if (r.dwellMinutes > t.maxDwell) t.maxDwell = r.dwellMinutes;
                // v10.43: Batch ID daha sonraki satırdan da gelebilir, eksikse doldur
                if (!t.batchId && r.batchId) t.batchId = r.batchId;
                // v10.48: Fracs flag — eğer Fracs sayfasındaysak bu sayfa için true olsun
                if (IS_EXSD_FRACS) t.isFracs = true;
                if (!t.cpt) {
                    const c = (r.cpt != null) ? { cpt: r.cpt, cptTs: r.cptTs } : tParseCptCell(r.exsd);
                    if (c.cpt) { t.cpt = c.cpt; t.cptTs = c.cptTs; }
                }
                if (hotpickIds && hotpickIds.has(r.toteId)) t.isHotpick = true;
                // empMap'ten doldur
                const emp = empMap && empMap.get(r.toteId);
                if (emp) {
                    if (emp.employee && !t.lastPicker) t.lastPicker = emp.employee.toLowerCase();
                    // v10.86: tote'un KENDİ katı (FC Research) — picker'ın katı DEĞİL
                    if (!t.fcFloor && emp.fcFloor) t.fcFloor = emp.fcFloor;
                    // v10.73/v10.86: lokasyon önceliği: gerçek aisle → katlı tampon → en güncel konum
                    if (!t.location) { if (emp.lastPick) t.location = emp.lastPick; else if (emp.floorLoc) t.location = emp.floorLoc; else if (emp.recentLoc) t.location = emp.recentLoc; }
                    if (emp.recentLoc && !t.curContainer) t.curContainer = emp.recentLoc;  // v11.66: güncel konteyner
                }
            }
            // Ek pass: empMap'te olup totes'ta olmayan ID'ler için son güncelleme
            if (empMap) {
                for (const [tid, emp] of empMap.entries()) {
                    if (totes[tid]) {
                        if (emp.employee && !totes[tid].lastPicker) totes[tid].lastPicker = emp.employee.toLowerCase();
                        if (!totes[tid].fcFloor && emp.fcFloor) totes[tid].fcFloor = emp.fcFloor;
                        if (!totes[tid].location) { if (emp.lastPick) totes[tid].location = emp.lastPick; else if (emp.floorLoc) totes[tid].location = emp.floorLoc; else if (emp.recentLoc) totes[tid].location = emp.recentLoc; }
                        if (emp.recentLoc && !totes[tid].curContainer) totes[tid].curContainer = emp.recentLoc;  // v11.66
                    }
                }
            }

            // ─── Lokasyon karar tablosu ────────────────────────────────
            // Tote ID tipine göre lokasyon kolonunu mantığa otur:
            //   1) P-X-...     (bin'in kendisi)        → "Bin"
            //   2) chPSMAINW.. (chuter)                → tam ID (chPSMAINW01D1)
            //   3) ts... / tsps... (gerçek tote)       → FC'den gelen P-X-... (sadece gerçekse)
            //   4) Diğer                                → FC'den gelen P-X-... veya boş
            // FC'den gelen lastPick zaten tParseFcResponse'da P-X-... olarak filtreleniyor;
            // ama emin olmak için burada bir daha kontrol ediyoruz.
            const isRealAisle = s => /^P-\d+-[A-Z0-9]/i.test(String(s || '').trim());
            const hasFloorTag = s => /P-?[1-6]-/i.test(String(s || ''));  // v10.86: "pmP-2-B" gibi katlı tampon
            for (const [tid, t] of Object.entries(totes)) {
                if (/^P-\d+-/i.test(tid)) {
                    // ID zaten bin lokasyonu — kısa etiket
                    t.location = 'Bin';
                } else if (/^chPSMAINW/i.test(tid)) {
                    // Chuter — tam ID'yi göster
                    t.location = tid;
                } else {
                    // Gerçek tote (ts..., tsps... veya bilinmeyen) — FC'den gelen lokasyon
                    // gerçek aisle DEĞİLSE boşalt; AMA P-N kat etiketi içeren tampon
                    // lokasyonu (ör. "pmP-2-B") KORU — kat çıkarımı için gerekli (v10.86).
                    if (t.location && !isRealAisle(t.location) && !hasFloorTag(t.location)) {
                        t.location = '';
                    }
                }
            }

            // ─── PREV-MERGE: Eski lokasyon/picker bilgisini koru ───────
            // empMap henüz dolmadıysa (enrichment devam ediyor) veya FC Research
            // başarısız olduysa, önceki fetch'teki lokasyon ve picker bilgileri
            // kullanılır. Bu sayede her tam fetch'te veriler 5-10sn boş kalmaz.
            // Sadece "ts.../tsps..." gerçek tote'ları için merge yapılır.
            for (const [tid, t] of Object.entries(totes)) {
                if (/^P-\d+-/i.test(tid) || /^chPSMAINW/i.test(tid)) continue; // Bin/Chuter zaten kesin
                const old = prevTotes[tid];
                if (!old) continue;
                // v10.86: kat bilgisi — yeni veride yoksa eskiyi koru
                if (!t.fcFloor && old.fcFloor) t.fcFloor = old.fcFloor;
                // Lokasyon: yeni veride yoksa eskiyi al (gerçek aisle veya katlı tampon)
                if (!t.location && old.location && (isRealAisle(old.location) || hasFloorTag(old.location))) {
                    t.location = old.location;
                }
                // Picker: yeni veride yoksa eskiyi al
                if (!t.lastPicker && old.lastPicker) {
                    t.lastPicker = old.lastPicker;
                }
                // v11.66: güncel konteyner — yeni veride yoksa eskiyi koru
                if (!t.curContainer && old.curContainer) t.curContainer = old.curContainer;
                // v10.48: Fracs flag preserved (önceki sayfada Fracs olarak işaretlenmişse koru)
                if (old.isFracs && !t.isFracs) t.isFracs = true;
            }

            // ─── v10.48: CROSS-PAGE MERGE ─────────────────────────────
            // Normal Rodeo + Fracs Rodeo iki ayrı sekmede açık olduğunda
            // her ikisi de AYNI cache'e yazıyor. Bu sayfanın okuduğu tote'lar
            // diğer sayfanın yazdığı tote'ları siliyor olmasın diye:
            //   - Bu sayfa Normal ise, prevTotes'ta isFracs=true olanları KORU
            //   - Bu sayfa Fracs ise, prevTotes'ta isFracs=false olanları KORU
            // Sadece "fresh" olan eski tote'lar (60sn'den yeni) korunur — eski
            // veri çağrılmaya devam eder, kullanıcı veri kaybetmez.
            const PREV_FRESH_MS = 60 * 1000;
            const prevTs = (prev && prev.ts) || 0;
            const prevIsFresh = prevTs && (Date.now() - prevTs) < PREV_FRESH_MS;
            if (prevIsFresh) {
                for (const [tid, old] of Object.entries(prevTotes)) {
                    if (totes[tid]) continue; // Bu sayfada zaten var, geç
                    // Kontrol: bu tote diğer sayfaya mı ait?
                    // Bu sayfa Normal ise diğer sayfa Fracs (old.isFracs=true)
                    // Bu sayfa Fracs ise diğer sayfa Normal (old.isFracs=false)
                    const isFromOtherPage = IS_EXSD_FRACS ? !old.isFracs : !!old.isFracs;
                    if (isFromOtherPage) {
                        // Diğer sayfanın tote'unu olduğu gibi koru
                        totes[tid] = old;
                    }
                }
            }
            // ───────────────────────────────────────────────────────────

            // ─── v11.74: CANLI AYNA (Rodeo doğruluk kaynağı, carry YOK) ─────
            // Kullanıcı kuralı: pano = Rodeo'nun birebir aynası. ItemList'te olan tote
            //   = panoda var, olmayan = yok. Hybrid yiyip Rodeo'dan düşen tote bir sonraki
            //   taramada (max 25sn) anında kaybolur. Toplam transit (özet) = yüklenen item
            //   sayısı (detay) eşit olur.
            //   v11.73 sticky-carry buradaydı → kaldırıldı: hybrid'i FC üzerinden yakalamak
            //   gecikmeli/güvenilmezdi (curContainer cache TTL'i nedeniyle) ve eski tote'lar
            //   30dk dolaşıyor, sayıları şişiriyordu (3.385 özet vs 5.758 detay).
            //   Wipe koruması (geçici hata/boş taramada listeyi süpürmeme) hâlâ runTransitFetch
            //   içinde (_hasPrevData + _wres.error kontrolü) — başarısız tarama listeyi bozmaz.
            // ───────────────────────────────────────────────────────────

            // v11.66 + v12.23: TRANSİTTEN DÜŞ — tote'un GÜNCEL konteyneri TESLİM/BUFFER alanına
            //   geçmişse listeden çıkar. Rodeo hâlâ "in transit" gösterse de bu tote fiziksel olarak
            //   ayrılmıştır. Düşen konteyner türleri (kullanıcı kuralı + gözlem):
            //     - "hybrid" → dz-P-Hybrid teslim (örn cvAtPM00002 → hybrid)
            //     - "STAGING" / "tcSTAGING" → staging buffer'a geçmiş (kullanıcı: tcSTAGING01'de kalan
            //       4 tote hâlâ panoda görünüyordu → artık düşer)
            //     - "tcBUFFER" / genel buffer staging işaretleri
            //   Not: curContainer FC Research'ten gelir; staging'e geçen tote'un konteyneri güncellenmiş
            //   olmalı. Cache TTL'siz kullanıldığı için (v12.11), staging geçişi bir sonraki FC
            //   sorgusunda yakalanır — o yüzden bu tote'lar en geç 60sn içinde düşer.
            const _DELIVERED_RE = /hybrid|staging|tcstaging|tcbuffer/i;
            let _hybDropped = 0;
            for (const [tid, t] of Object.entries(totes)) {
                if (_DELIVERED_RE.test(String(t.curContainer || ''))) { delete totes[tid]; _hybDropped++; }
            }
            if (_hybDropped) dlog(`📦 Transitten düştü (hybrid/staging/buffer konteyner = teslim): ${_hybDropped} tote`);

            const cptTotals = cptTotalsObj && cptTotalsObj.cptTotals || {};
            const cptTs     = cptTotalsObj && cptTotalsObj.cptTs     || {};
            const grandTotal= cptTotalsObj && cptTotalsObj.grandTotal|| Object.values(cptTotals).reduce((s,v)=>s+v,0);
            const payload = { totes, cptTotals, cptTs, grandTotal, ts: Date.now(), enriching: !!enriching, enrichProgress: progress || '' };

            // v12.08 [MUTLAK KORUMA]: Boş liste (totes={}) ile DOLU önceki listeyi ASLA silme.
            //   Kullanıcı şikayeti: "her şey yüklendikten sonra bir anda hepsi siliniyor."
            //   Sebep: bir tarama (manuel Veri Çek / Yenile / eski kod / DOM hazır değilken) 0 tote
            //   üretip listeyi süpürüyordu. Artık: yeni totes BOŞ ama önceki DOLUYSA → YAZMA, KORU.
            //   İSTİSNA: cptTotalsObj._allowEmpty === true (gerçek "Rodeo'da hiç transit yok" durumu,
            //   ExSD özeti de 0 ise) → o zaman temizlemeye izin ver. Normal taramalar bunu set etmez.
            const _newToteCount = Object.keys(totes).length;
            const _prevToteCount = Object.keys(prevTotes).length;
            const _allowEmpty = cptTotalsObj && cptTotalsObj._allowEmpty === true;
            if (_newToteCount === 0 && _prevToteCount > 0 && !_allowEmpty) {
                dlog('🛡 MUTLAK KORUMA: yeni liste boş ama önceki ' + _prevToteCount + ' tote DOLU → SİLİNMİYOR (önceki korunuyor)');
                return prev;   // önceki payload'ı geri ver, localStorage'a DOKUNMA
            }

            // v12.21 [FRACS KORUMA] — ASIL KÖK SEBEP FİX. Kullanıcı logu gösterdi:
            //   "🌐 Çekilen: 0 tote · 0 birim (özet 998)" + "📊 cache yazıldı: 0 normal, 4 Fracs · bu sayfa NORMAL"
            //   → Wide query 0 NORMAL tote döndürdü (Rodeo o an boş/DOM hazır değil), ama cache'te
            //   başka sekmeden (Fracs Rodeo) kalma 4 Fracs tote vardı → pano "4 tote" gösterdi. İşte
            //   "durduk yere gelen 4 tote / 4 Fracs" bu! Wide 0 normal döndürünce sadece Fracs kalıyor.
            //   ÇÖZÜM: Bu sayfa NORMAL (IS_EXSD_FRACS=false) VE bu taramada 0 NORMAL tote üretildi
            //   (yeni totes'un hepsi Fracs) VE önceki listede tote vardı → wide boş döndü demek, KORU.
            //   Not: allRows bu NORMAL sayfadan geldiği için içindeki tote'lar isFracs=false olmalı;
            //   totes içinde isFracs=true olanlar SADECE cross-page merge'den (başka sekme) gelir.
            if (!IS_EXSD_FRACS && !_allowEmpty && _prevToteCount > 0) {
                let _normalCount = 0, _fracsCount = 0;
                for (const tid in totes) { if (totes[tid].isFracs) _fracsCount++; else _normalCount++; }
                // Bu NORMAL sayfada 0 normal tote üretildi ama önceki listede veri vardı → wide boş.
                if (_normalCount === 0 && _prevToteCount > _fracsCount) {
                    dlog('🛡 FRACS KORUMA: NORMAL sayfada 0 normal tote (sadece ' + _fracsCount + ' Fracs kaldı, wide boş döndü) · önceki ' + _prevToteCount + ' tote → KORUNUYOR, bozuk Fracs-only liste YAZILMIYOR');
                    return prev;
                }
            }

            // v12.19 [KISMİ KORUMA] — v12.20 DÜZELTME: Wide query ARADA BİR çok eksik dönüyor
            //   (örn 2226 özet ama sadece 4 tote çekildi). Kullanıcı: "arada bir oluyor sonra düzeliyor,
            //   o 4 tote'lu bozuk kısmı KESİNLİKLE istemiyorum."
            //   v12.19 HATASI: Koruma sadece FINAL'de (!enriching) çalışıyordu. AMA bozuk 4-tote
            //   İLK BUILD'de yazılıyordu (o çağrı enriching=TRUE ile gelir) → koruma atlanıyordu.
            //   v12.20: enriching şartını KALDIRDIM. Ayrım artık tote SAYISINA göre:
            //     - Wide eksik (4 tote) + önceki DOLU (215) → 4 << 215*0.5 → KORU (ilk build olsa bile)
            //     - Kademeli enrichment: allRows zaten TAM (215 tote), _newToteCount=215 → koşul
            //       tetiklenmez (215 < 215*0.5 değil) → normal yazılır. Yani enrichment BOZULMAZ.
            //   Özet 3+ kat şartı: gerçek küçülmeyi (hybrid düştü, 215→180) korumadan ayırır.
            const _partialSuspect =
                   _prevToteCount >= 20                       // önceki listede anlamlı sayıda tote vardı
                && _newToteCount < _prevToteCount * 0.5        // yeni liste öncekinin yarısından AZ
                && grandTotal >= _newToteCount * 3             // özet, çekilen tote'un 3+ katı (ciddi eksik)
                && !_allowEmpty;
            if (_partialSuspect) {
                dlog('🛡 KISMİ KORUMA: wide eksik döndü (çekilen ' + _newToteCount + ' tote / önceki ' + _prevToteCount + ' / özet ' + grandTotal + ') → önceki DOLU liste KORUNUYOR, bozuk ' + _newToteCount + '-tote ekrana YAZILMIYOR');
                return prev;
            }

            // v12.05 [ATLAS-PATTERN]: Flush dedup — payload imzası önceki ile aynıysa YAZMA.
            //   Eskiden her flush yazıyordu → pano DOM titriyordu. Şimdi sadece veri değiştiyse yaz.
            //   ATLAS Bridge satır 711-714 ile aynı mantık (tam stringify).
            //   ts ve enrichProgress imzaya dahil EDİLMEZ (zaman geçtikçe değişir, içerik aynı).
            const _sigPayload = { totes, cptTotals, grandTotal, enriching: !!enriching };
            const _sig = JSON.stringify(_sigPayload);
            if (_lastTBuildFlushSig === _sig && !enriching) {
                // Aynı imza + enrichment bitti → yazmaya gerek yok
                return payload;
            }
            _lastTBuildFlushSig = _sig;

            push('cpt_transit_batches_v9', payload);
            // v10.48: Cache'in durumunu logla — normal vs Fracs dağılımı
            try {
                const allT = Object.values(totes);
                const fracsCnt = allT.filter(t => t.isFracs).length;
                const normCnt = allT.length - fracsCnt;
                dlog(`📊 Transit cache yazıldı: ${normCnt} normal, ${fracsCnt} Fracs · bu sayfa ${IS_EXSD_FRACS ? 'FRACS' : 'NORMAL'}`);
            } catch(e) {}
            return payload;
        }

        // ExSD özetinden CPT totalleri — cptTotals key'i artık "YYYY-MM-DD HH:MM"
        function tParseCptTotalsFromDom() {
            try {
                const row = document.getElementById('TotalPickingPickedInTransitId');
                if (!row) return null;
                const cptTotals = {}, cptTs = {};
                row.querySelectorAll('td a[href*="ExSDRange.RangeStartMillis"]').forEach(a => {
                    const href = a.getAttribute('href') || '';
                    const sm = href.match(/RangeStartMillis=(\d+)/);
                    const em = href.match(/RangeEndMillis=(\d+)/);
                    if (!sm || !em) return;
                    const startTs = parseInt(sm[1]), endTs = parseInt(em[1]);
                    if (endTs - startTs > 3600000) return; // genel subtotal, atla
                    const count = parseInt(a.textContent.trim().replace(/,/g,'')) || 0;
                    if (!count) return;
                    const midTs = Math.round((startTs + endTs) / 2 / 60000) * 60000;
                    const key = tFmtCptKey(midTs);
                    cptTotals[key] = (cptTotals[key] || 0) + count;
                    if (!cptTs[key]) cptTs[key] = midTs;
                });
                const grandTotal = Object.values(cptTotals).reduce((s,v)=>s+v, 0);
                return { cptTotals, cptTs, grandTotal };
            } catch (e) { return null; }
        }

        // Ana çalıştırıcı
        let _trRunning = false;
        // v11.77: Soğuk başlangıçta (cptLinks yok / 0 tote anomalisi / önceki veri yok) tarama
        //   "soft fail" sayılır. Bu durumda 25sn beklemek yerine 3sn sonra hızlı tekrar denenir.
        //   Timestamp set edilir; aşağıdaki retry timer kontrol eder.
        let _trNeedFastRetry = 0;
        let _trUnknownRetry = 0;   // v12.25: Bilinmeyen lokasyon tote'ları için hızlı retry zamanı
        // v11.54: ExSD "TotalPickingPickedInTransitId" satırındaki HER CPT'nin kendi drill-down
        //   linkini (ExSD özet sayısının geldiği <a>) döndür. Bu link açılınca o CPT'nin TAM tote
        //   listesi gelir — sayı bu linkten üretildiği için filtre/aralık/servis-sınıfı uyuşmazlığı
        //   OLAMAZ. "4 ExSD özet ama 0 tote" sorununu kökünden çözer.
        //   Dönen: [{cpt:"YYYY-MM-DD HH:MM", cptTs, count, href}]
        function tCptLinksFromDom() {
            const out = [];
            try {
                const row = document.getElementById('TotalPickingPickedInTransitId');
                if (!row) return out;
                row.querySelectorAll('td a[href*="ExSDRange.RangeStartMillis"]').forEach(a => {
                    const href = a.getAttribute('href') || '';
                    const sm = href.match(/RangeStartMillis=(\d+)/);
                    const em = href.match(/RangeEndMillis=(\d+)/);
                    if (!sm || !em) return;
                    const startTs = parseInt(sm[1]), endTs = parseInt(em[1]);
                    if (endTs - startTs > 3600000) return;   // genel subtotal (saat+) → atla
                    const count = parseInt((a.textContent || '').trim().replace(/,/g, '')) || 0;
                    if (!count) return;
                    const midTs = Math.round((startTs + endTs) / 2 / 60000) * 60000;
                    out.push({ cpt: tFmtCptKey(midTs), cptTs: midTs, count, href, startTs, endTs });
                });
            } catch (e) {}
            return out;
        }

        // v11.62: ExSD'deki "tüm transitler" (subtotal) linkini bul — en GENİŞ PickingPickedInTransit aralığı.
        //   tCptLinksFromDom bu geniş linki atlar (>1s); burada onu bulup TEK sorguda tüm transitleri çekeriz.
        function tFindWideTransitLink() {
            let best = null;
            try {
                const row = document.getElementById('TotalPickingPickedInTransitId');
                const scopes = [];
                if (row) scopes.push(row);
                scopes.push(document);   // subtotal ayrı <td> olabilir → tüm sayfaya da bak
                for (const scope of scopes) {
                    scope.querySelectorAll('a[href*="ItemList"][href*="RangeStartMillis"]').forEach(a => {
                        const href = a.getAttribute('href') || '';
                        if (!/PickingPickedInTransit/i.test(href)) return;
                        const sm = href.match(/RangeStartMillis=(\d+)/);
                        const em = href.match(/RangeEndMillis=(\d+)/);
                        if (!sm || !em) return;
                        const s = parseInt(sm[1]), e = parseInt(em[1]);
                        if (!(e > s)) return;
                        const span = e - s;
                        if (s <= 1 || span > 30 * 86400000) return;   // genel "Total"/sentinel (start=0 veya >30 gün span) → atla, gerçek transit ufku değil
                        if (!best || span > best.span) best = { href, startTs: s, endTs: e, span };
                    });
                    if (best) break;   // satırda bulduysak yeter
                }
            } catch (e) {}
            return best;
        }

        async function runTransitFetch() {
            if (_trRunning) { dlog('🟡 transit fetch zaten çalışıyor, atlandı'); return; }
            _trRunning = true;
            const t0 = Date.now();
            dlog('═══ TRANSIT FETCH BAŞLADI (Rodeo ExSD) ═══');
            try {
                // v11.72: Önceki taramada veri var mıydı? (soğuk başlangıç tespiti — boş/hatalı
                //   taramada listeyi SİLMEMEK için. "transitlerin hepsi bi anda kayboluyor" fix.)
                const _hasPrevData = (() => {
                    try {
                        const r = localStorage.getItem('cpt_transit_batches_v9');
                        const d = r ? (JSON.parse(r).data || JSON.parse(r)) : null;
                        return !!(d && d.totes && Object.keys(d.totes).length > 0);
                    } catch { return false; }
                })();
                // 1) ExSD özetindeki HER CPT'nin kendi drill-down linkini al (v11.54)
                const cptLinks = tCptLinksFromDom();
                // cptTotals (kart başlığındaki "N ExSD özet" sayıları)
                const totalsObj = tParseCptTotalsFromDom();
                if (totalsObj) dlog('✓ cptTotals: ' + Object.keys(totalsObj.cptTotals).length + ' CPT, ' + totalsObj.grandTotal + ' item');

                if (!cptLinks.length) {
                    dlog('❌ ExSD TotalPickingPickedInTransitId CPT linkleri yok (DOM yüklenmemiş olabilir).');
                    // v11.72: Önceki veri varsa SİLME — DOM henüz hazır değil = geçici. Liste korunur.
                    if (_hasPrevData) {
                        dlog('   → önceki transit listesi KORUNUYOR (silinmiyor)');
                        return;
                    }
                    // v11.75: cptLinks YOK + önceki veri YOK = soğuk başlangıç, Rodeo henüz hazır
                    //   değil. Eskiden cptTotals tek başına yazılıyordu → pano "3.123 transit / 0 tote"
                    //   gibi yanıltıcı görünüyordu (tutarsız). Artık HİÇ yazma → "Veri bekleniyor"
                    //   doğal mesajı kalır, bir sonraki taramada (DOM hazır olunca) doğru veri gelir.
                    // v11.77: 25sn beklemek yerine 3sn sonra HIZLI tekrar dene → soğuk başlangıç hızlanır.
                    _trNeedFastRetry = Date.now();
                    dlog('   → soğuk başlangıç (önceki veri yok), 3sn sonra hızlı tekrar denenecek');
                    return;
                }
                dlog('🚚 ' + cptLinks.length + ' CPT linki çekilecek: ' + cptLinks.map(l => l.cpt.slice(5) + '=' + l.count).join('  '));

                // 2) v11.62: TEK GENİŞ SORGU — subtotal "tüm transitler" linki → her satır Expected Ship Date'e göre gruplanır.
                //    Kullanıcı talebi: tek tek CPT yerine TEK yere bak. ItemList'te Expected Ship Date = CPT (TAM tarih,
                //    örn "2026-06-23 18:30"), o yüzden hücreye göre gruplamak doğru. Per-CPT yalnızca bir CPT HİÇ tote
                //    getirmezse (0-tote güvenlik ağı) devreye girer.
                const allRows = [];
                const toteSet = new Set();
                const rowSeen = new Set();   // v11.63: satır-bazlı (tote+demandId) tekilleştirme — qty doğru toplansın, sayfalama örtüşmesinde çift sayma olmasın
                const hotpickIds = new Set();
                const empCache = tLoadEmpCache();
                const empMap = new Map();
                _fcStats = { ok: 0, err: 0, lastErr: '' };   // v11.80: her tarama başında FC stats sıfırla

                // v12.05 [ATLAS-PATTERN]: localStorage'daki MEVCUT tote'lardan empMap'i pre-seed et.
                //   Eskiden sadece empCache (60-300sn TTL) kullanılıyordu → cache sınırında pano
                //   boşalıyordu. Artık localStorage'daki gerçek tote verisi (TTL'siz, son taramanın
                //   tam enrichment'ı) ANINDA empMap'e konur. Yeni tarama başladığında pano BOŞALMAZ
                //   — mevcut picker/lokasyon/kat bilgileri TTL'siz korunur. ATLAS Bridge satır 842-857.
                try {
                    const _prev = read('cpt_transit_batches_v9');
                    const _prevTotes = (_prev && _prev.totes) || (_prev && _prev.data && _prev.data.totes) || null;
                    if (_prevTotes) {
                        let _seeded = 0;
                        for (const tid of Object.keys(_prevTotes)) {
                            if (empMap.has(tid)) continue;
                            const t = _prevTotes[tid];
                            const emp = (t.lastPicker || '').trim();
                            const lp = (t.location || '').trim();
                            const rl = (t.curContainer || '').trim();
                            const ff = t.fcFloor || 0;
                            if (emp || lp || rl || ff) {
                                empMap.set(tid, { employee: emp, lastPick: lp, recentLoc: rl, fcFloor: ff, floorLoc: '' });
                                _seeded++;
                            }
                        }
                        if (_seeded) dlog('🌱 Pre-seed (önceki tarama): ' + _seeded + ' tote');
                    }
                    // v12.12: empCache'teki TÜM dolu kayıtları da empMap'e pre-seed et.
                    //   Kullanıcı: "1500 tote varsa hepsini yükle, lokasyon/picker'ı tekrar SİLME."
                    //   Cache'te (3451 kayıt) bir tote'un katı/picker'ı varsa, tote göründüğü ANDA
                    //   katına yerleşir — "Bilinmeyen lokasyon"da beklemez. Kat/lokasyon değişmez,
                    //   o yüzden TTL'siz kullanılır. Sadece cache'te HİÇ olmayan (yepyeni) tote fetch edilir.
                    let _cacheSeed = 0;
                    for (const tid of Object.keys(empCache)) {
                        if (empMap.has(tid)) continue;
                        const ce = empCache[tid];
                        if (ce && (ce.employee || ce.lastPick || ce.recentLoc || ce.fcFloor)) {
                            empMap.set(tid, { employee: ce.employee||'', lastPick: ce.lastPick||'', recentLoc: ce.recentLoc||'', fcFloor: ce.fcFloor||0, floorLoc: ce.floorLoc||'' });
                            _cacheSeed++;
                        }
                    }
                    if (_cacheSeed) dlog('🌱 Pre-seed (FC cache): ' + _cacheSeed + ' tote enrichment ANINDA hazır (TTL\'siz)');
                } catch (e) {}

                // throttled flush — UI'ı akışta güncelle
                // v11.72: Stream SIRASINDA (force=false) kısmi liste SADECE soğuk başlangıçta yazılır.
                //   Önceki tam liste varsa, stream bitene kadar (force=true) ONU göster — yoksa
                //   kısmi liste yazılıp "transitlerin hepsi bi anda kayboluyor" titremesi oluyordu.
                // v11.82: HER FLUSH'TA empCache'ten anında lookup yap. Yeni tarama başlasa bile
                //   önceki taramada bulunmuş tote'lar (60sn TTL cache) ANINDA katlara yerleşir.
                //   "0/13 Lokasyon yükleniyor" placeholder'ı görünmez, pano akıcı kalır.
                let _lastFlushMs = 0;
                const _flush = (force) => {
                    const now = Date.now();
                    if (!force) {
                        if (_hasPrevData) return;                 // önceki tam liste duruyor → kısmi yazma
                        if (now - _lastFlushMs < 120) return;     // v11.77: 300→120ms — soğuk başlangıçta ilk satırlar daha hızlı pano'ya
                    }
                    _lastFlushMs = now;
                    // v11.82: Cache'ten anlık enrichment — pano ilk render'da katlara dağılmış görsün
                    for (const tid of toteSet) {
                        if (empMap.has(tid)) continue;
                        const ce = empCache[tid];
                        if (tIsCacheFresh(ce) && (ce.employee || ce.lastPick || ce.recentLoc || ce.fcFloor)) {
                            empMap.set(tid, {
                                employee: ce.employee || '',
                                lastPick: ce.lastPick || '',
                                recentLoc: ce.recentLoc || '',
                                fcFloor: ce.fcFloor || 0,
                                floorLoc: ce.floorLoc || ''
                            });
                        }
                    }
                    tBuildAndFlush(allRows, hotpickIds, empMap, totalsObj, true, '0/' + toteSet.size);
                };

                // Fallback yol C için bilinen ItemList linki
                const _baseHref = tPickItemListHref(document, 'pickingpickedintransit');
                const _baseUrl  = _baseHref ? tAbs(location.href, _baseHref) : '';

                // ── Geniş aralık: subtotal "tüm transitler" linki + tüm per-CPT hücrelerini kapsa ──
                //   v11.68: GERİ ALINDI (v11.67 sadece subtotal linkinin aralığını kullanıyordu ama o
                //   aralık güncel transiti kapsamayıp BOŞ dönüyordu). Per-CPT linkleriyle birlikte
                //   en geniş aralığı al → veri kesin gelir.
                const _wideLink = tFindWideTransitLink();
                let wStart = Infinity, wEnd = -Infinity;
                if (_wideLink) { if (_wideLink.startTs < wStart) wStart = _wideLink.startTs; if (_wideLink.endTs > wEnd) wEnd = _wideLink.endTs; }
                for (const l of cptLinks) { if (l.startTs < wStart) wStart = l.startTs; if (l.endTs > wEnd) wEnd = l.endTs; }
                if (!isFinite(wStart)) wStart = Date.now() - 3600000;
                if (!isFinite(wEnd)) wEnd = Date.now() + 4 * 86400000;
                dlog('🔗 Geniş aralık (subtotal+per-CPT): ' + tFmtCptKey(wStart) + ' → ' + tFmtCptKey(wEnd));

                // 3) BİRİNCİL: TEK geniş sorgu — tüm transitler, tam sayfalama, Expected Ship Date'e göre grupla
                const wideUrl = tBuildCleanItemListUrl(wStart, wEnd);
                dlog('🌐 TÜM TRANSİTLER tek sorguda: ' + tFmtCptKey(wStart) + ' → ' + tFmtCptKey(wEnd));
                dlog('🔎 ' + wideUrl.substring(0, 175));
                // v12.21: expectedTotal = özet grandTotal → tStreamPages erken durmasın (Rodeo
                //   "of N results" vermese bile, özetten beklenen satır sayısını bilerek devam eder).
                const _expectedRows = (totalsObj && totalsObj.grandTotal) || 0;
                const _wres = await tStreamPages(wideUrl, (rows) => {
                    for (const r of rows) {
                        // v11.65: satır kimliği = tote|shipment|sku|demand — AYNI demandId farklı SKU'lar ayrı kalemdir
                        const rk = r.toteId + '|' + r.shipmentId + '|' + r.fnSku + '|' + r.demandId;
                        if (rowSeen.has(rk)) continue;                  // gerçek aynı kalem → atla
                        rowSeen.add(rk);
                        const cc = tParseCptCell(r.exsd);              // Expected Ship Date = CPT (tam tarih)
                        if (cc.cpt) { r.cpt = cc.cpt; r.cptTs = cc.cptTs; }
                        allRows.push(r); toteSet.add(r.toteId);        // TÜM kalemleri tut → tBuildAndFlush tote bazında birimleri toplar
                    }
                    _flush();
                    return true;
                }, _expectedRows);
                const _wideUnits = allRows.reduce((s, r) => s + (r.qty || 0), 0);
                dlog('🌐 Çekilen: ' + toteSet.size + ' tote · ' + _wideUnits + ' birim · ' + (_wres.pages || 1) + ' sayfa · ' + (_wres.rows || 0) + '/' + (_wres.total > 0 ? _wres.total : '?') + ' satır (özet ' + ((totalsObj && totalsObj.grandTotal) || '?') + ')');
                _flush(true);

                // 4) GÜVENLİK AĞI: geniş sorgudan HİÇ tote gelmeyen (0) ama özette sayısı olan CPT'yi kendi linkiyle doldur (nadir)
                let _loggedUrls = false, _diagDone = false;
                const fetchOneCpt = async (link) => {
                    const urlA = tEnsureSize(tAbs(location.href, link.href), 2000);
                    const urlB = (link.startTs && link.endTs) ? tBuildCleanItemListUrl(link.startTs, link.endTs) : '';
                    const urlC = (_baseUrl && link.startTs && link.endTs) ? tSetUrlRange(_baseUrl, link.startTs, link.endTs) : '';
                    if (!_loggedUrls) { _loggedUrls = true; dlog('🔎 Güvenlik ağı A: ' + urlA.substring(0, 150)); }
                    const rowsA = [];
                    const resA = await tStreamPages(urlA, (rs) => { for (const r of rs) rowsA.push(r); return true; });
                    const rowsB = [];
                    if (rowsA.length === 0 && urlB) await tStreamPages(urlB, (rs) => { for (const r of rs) rowsB.push(r); return true; });
                    const rowsC = [];
                    if (rowsA.length === 0 && rowsB.length === 0 && urlC) await tStreamPages(urlC, (rs) => { for (const r of rs) rowsC.push(r); return true; });
                    const used = rowsA.length ? rowsA : (rowsB.length ? rowsB : rowsC);
                    const usedLabel = rowsA.length ? 'A' : (rowsB.length ? 'B' : (rowsC.length ? 'C' : '-'));
                    let addedHere = 0;
                    for (const r of used) {
                        const rk = r.toteId + '|' + r.shipmentId + '|' + r.fnSku + '|' + r.demandId;
                        if (rowSeen.has(rk)) continue;                 // gerçek aynı kalem → atla (çift sayma yok)
                        rowSeen.add(rk);
                        if (!toteSet.has(r.toteId)) addedHere++;       // yeni TOTE sayısı (log için)
                        r.cpt = link.cpt; r.cptTs = link.cptTs;
                        allRows.push(r); toteSet.add(r.toteId);        // TÜM kalemleri tut → birimler toplanır
                    }
                    dlog('   🔁 ' + link.cpt + ' güvenlik ağı: özet=' + link.count + ' +' + addedHere + ' yeni tote · yol=' + usedLabel);
                    _flush();
                    if (!used.length && !_diagDone) {
                        _diagDone = true;
                        try {
                            const rr = await trGet(urlB || urlA, 15000);
                            const dbody = rr && rr.responseText || '';
                            const hasTbl = /dwell/i.test(dbody) && /scannable/i.test(dbody);
                            dlog('🧪 TEŞHİS ' + link.cpt + ' status=' + (rr && rr.status) + ' len=' + dbody.length + ' tablo?=' + hasTbl);
                        } catch (e) { dlog('🧪 TEŞHİS hata: ' + (e && e.message || e)); }
                    }
                    return { error: resA.error && !used.length };
                };

                // v11.68: GÜVENLİK AĞI — geniş sorgudan eksik/HİÇ gelen CPT'yi kendi (Rodeo'nun
                //   ürettiği) linkiyle doldur. urlA = ham kazınmış href → filtre/aralık uyuşmazlığı
                //   OLAMAZ (sayı bu linkten geldi). Global rowSeen → çift sayma yok.
                const _gotByCpt = {};
                for (const r of allRows) { const k = r.cpt; if (k) _gotByCpt[k] = (_gotByCpt[k] || 0) + (r.qty || 0); }
                const _shortLinks = cptLinks.filter(l => l.count > 0 && (_gotByCpt[l.cpt] || 0) < l.count * 0.85);
                // v12.13 [Kullanıcı talebi]: "Yüklendikten sonra tekrar 500/50/100 parçalı yükleme."
                //   Per-CPT fallback (eksik CPT'leri tek tek çekme) SADECE şu durumlarda çalışsın:
                //     1. İLK tarama (önceki veri yok) — eksiksiz başlangıç için
                //     2. Wide query TAMAMEN boş (0 tote) — acil durum, seri mod
                //   Önceki veri VARSA ve wide bir şeyler getirdiyse → fallback ATLA. Eksik kalan
                //   tote'lar zaten bir sonraki taramada gelir; mevcut tote'lar korunuyor (pre-seed).
                //   Bu, "transit içeriği değişmiyor, tekrar tekrar çekme" mantığının uygulaması.
                const _wideEmpty = toteSet.size === 0;
                const _skipFallback = _hasPrevData && !_wideEmpty;
                if (_skipFallback && _shortLinks.length) {
                    dlog('⏭ Per-CPT fallback ATLANDI (' + _shortLinks.length + ' CPT eksik ama önceki veri var, içerik korunuyor — tekrar yükleme yok)');
                }
                if (_shortLinks.length && !_skipFallback) {
                    if (_wideEmpty) {
                        // v11.79: Wide 0 tote = Rodeo geniş sorguyu boş döndürdü.
                        // v12.06: SERİ yerine 3'ERLİ DÜŞÜK PARALEL — eskiden tam seri 8 CPT'yi
                        //   ~38sn'de bitiriyordu, 60sn aralığı aşıp BİR SONRAKİ taramayla çakışıyordu
                        //   → pano boşalıyordu. 3 paralel: throttle riski hâlâ düşük ama ~3× hızlı
                        //   (38sn → ~12sn), 60sn'i asla aşmaz, çakışma olmaz. Wide query düzelince
                        //   (v12.06 URL fix) bu fallback'e zaten nadiren girilir.
                        const _serialLinks = _shortLinks.slice().sort((a, b) => (a.cptTs || 0) - (b.cptTs || 0));
                        dlog('⚡ Geniş sorgu 0 tote — ' + _serialLinks.length + ' CPT 3\'erli paralel çekiliyor (hızlı, çakışmasız)');
                        let _serialDone = 0;
                        await tPool(_serialLinks, 3, async (link) => {
                            await fetchOneCpt(link);
                            _serialDone++;
                            _flush(true);                      // her CPT'den sonra ekrana yaz → kademeli görünür
                            dlog('   📥 İlerleme: ' + _serialDone + '/' + _serialLinks.length + ' CPT · şu ana dek ' + toteSet.size + ' tote');
                        });
                    } else {
                        // Wide çalıştı, sadece birkaç CPT eksik → düşük paralel (hızlı tamamla, throttle az)
                        dlog('🔁 ' + _shortLinks.length + ' CPT eksik (geniş<özet) — güvenlik ağı: ' + _shortLinks.map(l => l.cpt.slice(5) + '(' + (_gotByCpt[l.cpt] || 0) + '/' + l.count + ')').join('  '));
                        await tPool(_shortLinks, TR_CPT_CONC, async (link) => { await fetchOneCpt(link); });
                        _flush(true);
                    }
                } else {
                    dlog('✓ Tek geniş sorgu tüm CPT\'leri kapsadı — güvenlik ağı gerekmedi');
                }

                const _fetchedUnits = allRows.reduce((s, r) => s + (r.qty || 0), 0);
                const _ozetTotal = (totalsObj && totalsObj.grandTotal) || 0;
                const _pct = _ozetTotal ? Math.round(_fetchedUnits / _ozetTotal * 100) : 0;
                dlog('🚚 CPT-link çekim bitti: ' + toteSet.size + ' tote · çekilen ' + _fetchedUnits + ' birim / özet ' + _ozetTotal + ' birim (%' + _pct + ')' + (_fetchedUnits < _ozetTotal * 0.9 ? ' ⚠ EKSİK — yukarıdaki ⚠EKSİK CPT loglarına bak' : ' ✓'));

                // v11.74: CANLI AYNA — eski tote'lar FC kuyruğuna eklenmez. Rodeo ItemList'te
                //   olan tote = panoda var, olmayan = yok. Hybrid yiyip Rodeo'dan düşen tote
                //   bir sonraki taramada anında kaybolur. Toplam = detay eşitliği korunur.

                if (!toteSet.size) {
                    // v11.72: 0 tote — stream HATASI varsa (geçici network/throttle takılması) ve
                    //   önceki veri varsa listeyi SİLME, önceki kalsın. Hata yoksa gerçekten boş →
                    //   temizle (Rodeo'da gerçekten transit kalmamış = mirror current).
                    // v11.76: ANOMALİ KORUMASI artık _hasPrevData'dan BAĞIMSIZ. Eskiden ilk
                    //   açılışta (önceki veri yokken) ExSD özeti pozitif olsa bile boş yazılıyordu
                    //   → cache "totes={} + grandTotal=3227" gibi kötü bir hâlde kalıyor, sonraki
                    //   8sn refresh "Yenilendi" yalanı söylüyordu. Şimdi: özet > 0 = tutarsız
                    //   sorgu → HİÇ YAZMA, "Veri bekleniyor" doğal mesajı kalsın, bir sonraki
                    //   tarama doğru veriyle dolduracak.
                    // v11.77: önceki veri yoksa 3sn sonra hızlı tekrar dene (25sn beklemeden).
                    if (_wres && _wres.error) {
                        if (_hasPrevData) dlog('⚠ 0 tote + stream HATASI → önceki liste KORUNUYOR (geçici takılma, silinmiyor)');
                        else { dlog('⚠ 0 tote + stream HATASI (önceki veri yok) → 3sn sonra hızlı tekrar denenecek'); _trNeedFastRetry = Date.now(); }
                        return;
                    }
                    if (_ozetTotal > 0) {
                        if (_hasPrevData) dlog('⚠ 0 tote + özet ' + _ozetTotal + ' → ANOMALİ (sorgu boş ama Rodeo transit var) → önceki liste KORUNUYOR');
                        else { dlog('⚠ 0 tote + özet ' + _ozetTotal + ' (önceki veri yok) → ANOMALİ, 3sn sonra hızlı tekrar denenecek'); _trNeedFastRetry = Date.now(); }
                        return;
                    }
                    dlog('⚠ 0 tote (hata yok / özet de 0) — gerçekten boş, liste temizleniyor');
                    // v12.08: Bu GERÇEK boşluk (ExSD özeti de 0 = Rodeo'da hiç transit yok).
                    //   Mutlak korumaya "temizlemeye izin var" sinyali ver.
                    tBuildAndFlush([], hotpickIds, empMap, Object.assign({}, totalsObj, { _allowEmpty: true }), false, '');
                    return;
                }

                // 5) Build (henüz enrich yok)
                tBuildAndFlush(allRows, hotpickIds, empMap, totalsObj, true, '0/' + toteSet.size);
                const fetchSec = ((Date.now() - t0) / 1000).toFixed(1);
                dlog('✓ Fetch tamamlandı:', toteSet.size, 'tote,', allRows.length, 'satır,', fetchSec + 's');

                // 6) FC Research enrichment (cache + paralel pool)
                // v12.11 [KRİTİK FİX]: Cache'te 3451 DOLU kayıt vardı (floor/picker/loc) ama
                //   tIsCacheFresh TTL=300sn yüzünden çoğunu "eski" sayıp REDDEDİYORDU → her tarama
                //   sıfırdan fetch → enrichment bitmiyordu → 181 tote "Diğer"de kalıyordu.
                //   GERÇEK: Bir tote'un KATI ve LOKASYONU değişmez (tote pick edilip floor'a konunca
                //   orada kalır). O yüzden cache'te DOLU (floor/picker olan) kayıt varsa TTL'e BAKMA,
                //   DİREKT KULLAN. Sadece BOŞ (neg) kayıtlar için TTL geçerli (belki sonra floor gelir).
                // v12.23 [STAGING RECHECK]: Uzun süredir transit'te olan tote'lar staging/buffer'a
                //   (tcSTAGING01) geçmiş olabilir. Cache TTL'siz kullanıldığı için (v12.11) curContainer
                //   eski floor'da kalıyor, staging geçişi görünmüyordu → Rodeo'da olmayan tote panoda
                //   kalıyordu. ÇÖZÜM: Orta+yüksek dwell tote'ları cache'te floor olsa BİLE yeniden
                //   FC-sorgula → güncel curContainer gelir, hybrid/staging'e geçmişse tBuildAndFlush düşürür.
                //   Dwell'i allRows'tan hesapla (aynı tote'un max dakikası).
                const _dwellByTote = {};
                for (const r of allRows) {
                    const d = r.dwellMinutes || 0;
                    if (d > (_dwellByTote[r.toteId] || 0)) _dwellByTote[r.toteId] = d;
                }
                // v12.24: Hybrid HIZLI TESPİT — eşik 75→20dk. Kullanıcı: "hybrid yiyen tote'lar geç
                //   düşüyor." Hybrid/staging geçişi 15-20dk'da olabiliyor, 75dk çok geçti. AMA her
                //   taramada aynı tote'u sorgulamak yavaşlatır → recheck sadece son kontrolden 90sn
                //   geçmişse (curContainer için hafif TTL). Böylece hızlı tespit + fazla sorgu yok.
                const HYBRID_RECHECK_DWELL = 20;    // dk — bu dwell'i aşan tote hybrid/staging olabilir
                const HYBRID_RECHECK_INTERVAL = 90000;  // ms — aynı tote en fazla 90sn'de bir recheck
                // v12.25: BİLİNMEYEN LOKASYON AGRESİF ÇEKİM. Kullanıcı: "neredeyse hiç bilinmeyen
                //   lokasyon istemiyorum, çok daha hızlı olmalı, ÖNCELİK bu." Kök sebep: dwell düşük
                //   (yeni pick) tote'lar FC Research'e henüz YANSIMAMIŞ olabiliyor → fetch boş dönüyor →
                //   neg cache 120sn tutuyor → o süre tekrar denenmiyor → tote "Bilinmeyen"de kalıyor.
                //   ÇÖZÜM: Yeni tote'ların (dwell < 15dk) neg cache'ini ÇOK KISA (15sn) say → her taramada
                //   tekrar dene. FC'ye kayıt düşer düşmez (genelde birkaç dk) anında yakalanır, katına geçer.
                const FRESH_TOTE_DWELL = 30;        // dk — bundan yeni tote FC'de henüz olmayabilir
                //   v12.52: 15→30 — kullanıcı ekranında 17-21dk dwell'li tote'lar 'Bilinmeyen'de takılıydı:
                //   15dk eşiğini aştıkları için boş FC yanıtı 120sn neg-cache'leniyor, 2dk retry edilmiyordu.
                //   30dk'ya kadar kısa (15sn) neg TTL uygulanır → bu bant da hızlı retry alır, katına geçer.
                const FRESH_NEG_TTL    = 15000;     // ms — yeni tote boş dönerse 15sn sonra tekrar dene

                const toFetch = [];      // yeni/eksik tote — ÖNCELİKLİ (Bilinmeyen hızlı dolsun)
                const toRecheck = [];    // hybrid recheck — ikincil (dolu ama güncel konteyner kontrolü)
                let cacheHits = 0, seedHits = 0;
                const _nowMs = Date.now();
                for (const tid of toteSet) {
                    const em = empMap.get(tid);
                    const ce = empCache[tid];
                    const _hasFull = (em && (em.employee || em.lastPick || em.recentLoc || em.fcFloor))
                                  || (ce && (ce.employee || ce.lastPick || ce.recentLoc || ce.fcFloor));
                    const _dwell = _dwellByTote[tid] || 0;
                    // v12.24: Dolu tote + orta/yüksek dwell + son kontrolden 90sn geçti → hybrid recheck
                    const _lastChk = (ce && ce._contChk) || 0;
                    const _needRecheck = _hasFull && _dwell >= HYBRID_RECHECK_DWELL && (_nowMs - _lastChk) >= HYBRID_RECHECK_INTERVAL;
                    if (_needRecheck) { toRecheck.push(tid); continue; }
                    // Dolu (pre-seed veya cache) → kullan, fetch etme
                    if (em && (em.employee || em.lastPick || em.recentLoc || em.fcFloor)) { seedHits++; continue; }
                    if (ce && (ce.employee || ce.lastPick || ce.recentLoc || ce.fcFloor)) {
                        empMap.set(tid, { employee: ce.employee||'', lastPick: ce.lastPick||'', recentLoc: ce.recentLoc||'', fcFloor: ce.fcFloor||0, floorLoc: ce.floorLoc||'' });
                        cacheHits++;
                        continue;
                    }
                    // v12.25: BOŞ (neg) kayıt TTL kontrolü — YENİ tote için çok kısa (15sn), eski için normal.
                    //   Yeni tote FC'ye yansımamış olabilir → sık tekrar dene → Bilinmeyen'de kalmasın.
                    if (ce && ce.neg) {
                        const _negTtl = (_dwell < FRESH_TOTE_DWELL) ? FRESH_NEG_TTL : TR_EMP_NEG_TTL;
                        if ((_nowMs - (ce.ts || 0)) <= _negTtl) { cacheHits++; continue; }
                        // TTL doldu → tekrar fetch (aşağıda toFetch'e düşecek)
                    }
                    // Yeni/eksik tote → ÖNCELİKLİ fetch listesi (Bilinmeyen lokasyon hızlı dolsun)
                    toFetch.push(tid);
                }
                // v12.24: ÖNCE yeni tote'lar (Bilinmeyen lokasyon hızlansın), SONRA hybrid recheck'ler.
                //   Böylece "Diğer"deki tote'lar önce katına yerleşir, recheck'ler arkadan gelir.
                // v12.52: DWELL ÖNCELİĞİ (kullanıcı talebi) — her iki liste kendi içinde EN YÜKSEK
                //   dwell'den en düşüğe sıralanır: en uzun bekleyen tote'un lokasyonu/pickeri İLK çekilir.
                //   En kritik tote'lar (dwell yüksek = CPT riski) panoda ilk yerine oturanlar olur.
                const _byDwellDesc = (a, b) => (_dwellByTote[b] || 0) - (_dwellByTote[a] || 0);
                toFetch.sort(_byDwellDesc);
                toRecheck.sort(_byDwellDesc);

                // ═══ v12.54 TOPLU FC OKUMA ("Atlas tarzı", kullanıcı talebi) ═══
                //   Tek tek tote sorgusu yerine FC Research ÇOKLU ARAMA: tek istekte 40 tote
                //   (results?s=id1,id2,...). 175 tote ≈ 4-5 istek → hepsi saniyeler içinde dolar.
                //   Batch ID GEREKMEZ — single/multi her tote'a çalışır. Toplu yanıtta çözülemeyen
                //   tote'lar alttaki tekli (dwell öncelikli) kuyruğa kalır. Bu FC kurulumu çoklu
                //   aramayı desteklemiyorsa (2 istek üst üste 200 dönüp 0 tote çözerse) oturum
                //   boyunca kapatılır (_bulkFcDead) ve tekli yol tek başına sürer — regresyon yok.
                if (!window._bulkFcDead && toFetch.length > 3) {
                    const BULK_SIZE = 40, BULK_CONC = 3, BULK_TIMEOUT = 15000;
                    const _chunks = [];
                    for (let i = 0; i < toFetch.length; i += BULK_SIZE) _chunks.push(toFetch.slice(i, i + BULK_SIZE));
                    let _bZeroStreak = window._bulkFcZeroStreak || 0, _bReq200 = 0;
                    const _bResolved = new Set();
                    await tPool(_chunks, BULK_CONC, async (ids) => {
                        try {
                            const url = TR_FC_HOST_PRIMARY + TR_FC + '/results?s=' + encodeURIComponent(ids.join(','));
                            const r = await trGet(url, BULK_TIMEOUT);
                            if (!r || r.status !== 200 || !r.responseText) return;
                            _bReq200++;
                            const map = tParseFcBulkList(r.responseText, ids);
                            const got = Object.keys(map);
                            if (!got.length) { _bZeroStreak++; return; }
                            _bZeroStreak = 0;
                            for (const tid of got) {
                                const m = map[tid];
                                empMap.set(tid, { employee: m.employee || '', lastPick: m.lastPick || '', recentLoc: m.recentLoc || '', fcFloor: m.fcFloor || 0, floorLoc: m.floorLoc || '' });
                                empCache[tid] = { employee: m.employee || '', lastPick: m.lastPick || '', recentLoc: m.recentLoc || '', fcFloor: m.fcFloor || 0, floorLoc: m.floorLoc || '', ts: Date.now(), _contChk: Date.now() };
                                _bResolved.add(tid);
                            }
                            // Anında ekrana yaz — "hepsi bir anda doluyor" hissi buradan gelir
                            tBuildAndFlush(allRows, hotpickIds, empMap, totalsObj, true, (cacheHits + seedHits + _bResolved.size) + '/' + toteSet.size);
                            tSaveEmpCache(empCache);
                        } catch (e) {}
                    });
                    window._bulkFcZeroStreak = _bZeroStreak;
                    if (_bReq200 >= 2 && _bZeroStreak >= 2) {
                        window._bulkFcDead = true;
                        dlog('📡 TOPLU FC: çoklu arama bu FC\'de desteklenmiyor görünüyor (200 döndü, 0 çözüm ×2) → kapatıldı, tekli yol devrede');
                    }
                    if (_bResolved.size) {
                        for (let i = toFetch.length - 1; i >= 0; i--) if (_bResolved.has(toFetch[i])) toFetch.splice(i, 1);
                        dlog('📡 TOPLU FC: ' + _chunks.length + ' istekte ' + _bResolved.size + ' tote çözüldü · tekliye kalan: ' + toFetch.length);
                    }
                }
                const _fetchOrder = toFetch.concat(toRecheck);
                dlog('👤 Enrichment: pre-seed ' + seedHits + ' · cache ' + cacheHits + ' · YENİ fetch ' + toFetch.length + (toRecheck.length ? ' · hybrid-recheck ' + toRecheck.length : '') + (_fetchOrder.length === 0 ? ' ✓ (hepsi cache\'ten)' : ''));

                let done = 0, _fcOk = 0, _fcEmpty = 0, _fcErr = 0;
                await tPool(_fetchOrder, TR_FC_CONCURRENCY, async (tid) => {
                    const _res = await tFetchEmployee(tid);
                    // v12.54 KÖK SEBEP FİX: AĞ HATASI ≠ "FC'de kayıt yok". Eskiden timeout/HTTP hatası
                    //   yiyen tote da neg-cache'e (15-120sn karantina) yazılıyordu → yoğun anda hata
                    //   yiyen onlarca tote "Bilinmeyen"de birikiyordu (91'lik yığın). Artık hata alan
                    //   tote CACHE'E YAZILMAZ → bir sonraki taramada anında tekrar denenir.
                    if (_res && _res._err) { _fcErr++; done++; return; }
                    const { employee, lastPick, recentLoc, fcFloor, floorLoc } = _res;
                    const emp = (employee||'').trim(), lp = (lastPick||'').trim(), rl = (recentLoc||'').trim();
                    const ff = fcFloor||0, fl = (floorLoc||'').trim();
                    if (emp || lp || rl || ff) {
                        empMap.set(tid, { employee: emp, lastPick: lp, recentLoc: rl, fcFloor: ff, floorLoc: fl });
                        // v12.24: _contChk = curContainer'ın en son ne zaman tazelendiği (hybrid recheck TTL için)
                        empCache[tid] = { employee: emp, lastPick: lp, recentLoc: rl, fcFloor: ff, floorLoc: fl, ts: Date.now(), _contChk: Date.now() };
                        _fcOk++;
                    } else {
                        empCache[tid] = { employee:'', lastPick:'', ts: Date.now(), neg: 1 };
                        _fcEmpty++;
                    }
                    done++;
                    // v12.22: Flush eşiği 15 → 10 — "Bilinmeyen lokasyon"daki tote'lar DAHA HIZLI
                    //   katlarına geçsin (her 10 fetch'te veri yazılır). Titreme riski YOK çünkü HTML
                    //   tarafı (v12.22) enrichment sırasında render'ı 1200ms'e seyretiyor → veri sık
                    //   yazılır ama ekran akıcı güncellenir. Hız + akıcılık birlikte.
                    if (done % 8 === 0) {   // v12.52: 10→8 — kat kartları biraz daha sık dolsun
                        tBuildAndFlush(allRows, hotpickIds, empMap, totalsObj, true, (cacheHits + seedHits + done) + '/' + toteSet.size);
                        tSaveEmpCache(empCache);   // ara kayıt — yarıda kesilse veri güvende
                    }
                });
                dlog('👤 FC enrichment bitti: ' + _fcOk + ' başarılı (lokasyon/picker geldi) · ' + _fcEmpty + ' boş yanıt (FC\'de iz yok) · ' + _fcErr + ' ağ hatası (karantina YOK, sonraki taramada tekrar denenir)');
                dlog('🌐 FC network: ' + _fcStats.ok + ' HTTP 200 · ' + _fcStats.err + ' hata' + (_fcStats.lastErr ? ' (son: ' + _fcStats.lastErr + ')' : ''));
                tSaveEmpCache(empCache);

                // 7) Final flush — enriching:false
                tBuildAndFlush(allRows, hotpickIds, empMap, totalsObj, false, '');
                const totalSec = ((Date.now() - t0) / 1000).toFixed(1);

                // v12.25: BİLİNMEYEN RETRY — enrichment bittikten sonra hâlâ lokasyonu/katı OLMAYAN
                //   tote var mı? (Bilinmeyen lokasyonda kalanlar). Bunlar genelde FC'ye henüz yansımamış
                //   yeni tote'lar. 60sn beklemeden, 15sn sonra HIZLI tekrar tara → FC'ye kayıt düşmüşse
                //   anında katına geçer. Kullanıcı: "neredeyse hiç bilinmeyen istemiyorum." Böylece
                //   Bilinmeyen tote'lar 60sn değil ~15sn içinde çözülür. Sadece Bilinmeyen VARSA tetikler
                //   (hepsi yerleştiyse gereksiz tarama yok).
                let _unknownCount = 0;
                try {
                    const _cur = read('cpt_transit_batches_v9');
                    const _curTotes = (_cur && _cur.totes) || {};
                    for (const tid in _curTotes) {
                        const t = _curTotes[tid];
                        const _hasLoc = (t.fcFloor >= 1 && t.fcFloor <= 6) || (t.location && t.location.trim());
                        if (!_hasLoc) _unknownCount++;
                    }
                } catch (e) {}
                if (_unknownCount > 2) {   // 1-2 tane kabul edilebilir (kullanıcı), 3+ ise hızlı retry
                    _trUnknownRetry = Date.now();
                    dlog('🔄 ' + _unknownCount + ' tote hâlâ Bilinmeyen lokasyonda → 15sn sonra hızlı tekrar denenecek (FC\'ye yansımışsa yakalanır)');
                }

                dlog('✅ TRANSIT TAMAMLANDI:', toteSet.size, 'tote,', empMap.size, 'enriched,', hotpickIds.size, 'hotpick,', totalSec + 's' + (_unknownCount ? ' · ' + _unknownCount + ' bilinmeyen' : ''));
            } catch (e) {
                dlog('❌ runTransitFetch hata:', String(e && e.message || e));
            } finally {
                _trRunning = false;
            }
        }

        // Tetikleyiciler
        // a) Sayfa yüklenince hemen (v11.77: 200→100ms — daha agresif erken başlama)
        setTimeout(runTransitFetch, 100);
        // a2) v10.59: Arka plan throttling'e karşı EK tetikleyiciler.
        //     Sayfa reload sonrası arka plandaysa 200ms timer gecikebilir.
        //     Bu yüzden birkaç kademeli güvence fetch'i koyuyoruz.
        //     v11.77: kademeleri sıkılaştır — Rodeo DOM erken hazır olursa anında yakala.
        setTimeout(runTransitFetch, 600);
        setTimeout(runTransitFetch, 1500);
        setTimeout(runTransitFetch, 3500);
        // a3) Sekme görünür/gizli olduğunda da tetikle — kullanıcı sekmeye dönünce
        //     anında taze veri, sekmeden çıkarken son bir fetch.
        document.addEventListener('visibilitychange', () => {
            // Görünürlük değiştiğinde (her iki yön) bir fetch tetikle
            setTimeout(runTransitFetch, 100);
        });
        // a4) Pencere focus/blur — ek güvence (bazı tarayıcılarda visibilitychange geç gelir)
        window.addEventListener('focus', () => { setTimeout(runTransitFetch, 100); });
        window.addEventListener('pageshow', () => { setTimeout(runTransitFetch, 300); });
        // b) Periyodik fetch — DAHA HIZLI POLLING (kullanıcı isteği):
        //    - 25sn'de bir TAM fetch (ItemList stream + enrichment)
        //    - 8sn'de bir HAFİF cptTotals refresh (sadece DOM parse, network yok)
        //      Anlık canlı hissi verir, throttle riski düşük.
        // v12.01: 25sn → 60sn — kullanıcı talebi. İlk yükleme tam, sonraki yenilemeler delta:
        //   cache lookup (v11.82) ile mevcut tote'ların lokasyon/picker bilgisi ANINDA uygulanır,
        //   sadece yeni tote'lar için FC fetch yapılır. Hybrid yiyen tote Rodeo'dan düşer, bizde de.
        setInterval(runTransitFetch, 60 * 1000);

        // v11.77: HIZLI RETRY — soğuk başlangıçta (cptLinks yok / 0 tote anomalisi) bir tarama
        //   "soft fail" olarak işaretlenir. 25sn beklemek yerine 3sn sonra tekrar dene.
        //   Bu sayede Rodeo DOM'u hazır olur olmaz (genelde 1-5sn) hemen yakalanır.
        setInterval(() => {
            if (!_trNeedFastRetry) return;
            const age = Date.now() - _trNeedFastRetry;
            if (age < 3000) return;                      // henüz 3sn dolmadı
            if (_trRunning) return;                       // başka tarama sürüyor
            _trNeedFastRetry = 0;                         // tüket
            dlog('🔁 Hızlı retry tetiklendi (soft-fail sonrası)');
            runTransitFetch();
        }, 1500);

        // v12.25: BİLİNMEYEN RETRY interval — enrichment sonrası 3+ tote hâlâ lokasyonsuzsa
        //   (Bilinmeyen), 15sn sonra tekrar tara. FC'ye yansımış tote'lar yakalanır → Bilinmeyen
        //   hızla boşalır. Kullanıcı: "neredeyse hiç bilinmeyen istemiyorum, öncelik bu."
        setInterval(() => {
            if (!_trUnknownRetry) return;
            const age = Date.now() - _trUnknownRetry;
            if (age < 15000) return;                     // 15sn bekle (FC'ye kayıt düşsün)
            if (_trRunning) return;                       // başka tarama sürüyor
            _trUnknownRetry = 0;                          // tüket
            dlog('🔄 Bilinmeyen retry tetiklendi → yeniden tarama (FC\'ye yansıyan tote\'lar katına geçecek)');
            runTransitFetch();
        }, 3000);

        // Hafif refresh — sadece ExSD DOM'undaki cptTotals'ı güncelle (network yok)
        // Bu sayede tote sayıları/CPT toplam'ı 8sn'de bir yenilenir.
        // v11.75: cur.totes BOŞSA hiç dokunma → "Yenilendi" yalanı olmaz, sayılar şişmez.
        //   (Eski cache'te boş totes + pozitif özet kalmış olabilir; ilk tarama dolduracak.)
        setInterval(() => {
            try {
                const tot = tParseCptTotalsFromDom();
                if (!tot) return;
                const cur = read('cpt_transit_batches_v9');
                if (!cur) return;
                if (!cur.totes || Object.keys(cur.totes).length === 0) return;   // boş cache → yazma
                cur.cptTotals = tot.cptTotals;
                cur.cptTs     = tot.cptTs;
                cur.grandTotal = tot.grandTotal;
                cur.ts = Date.now();
                push('cpt_transit_batches_v9', cur);
            } catch (e) { /* sessizce */ }
        }, 8 * 1000);

        // c) HTML'den gelen force_fetch sinyali — anlık tepki
        // localStorage'da "son işlenen ts"'yi saklıyoruz, böylece reload sonrası ikinci tur olmaz
        const SEEN_KEY = 'cpt_force_fetch_last_seen';
        let _heartbeatCounter = 0;
        setInterval(() => {
            try {
                let req = null;
                let source = '';
                // Kanal 1: GM storage (cross-domain için en güvenilir)
                try {
                    const gm = GM_getValue('cpt_force_fetch_gm', null);
                    if (gm && gm.ts) { req = gm; source = 'GM'; }
                } catch {}
                // Kanal 2: localStorage (same-origin için)
                if (!req) {
                    try {
                        const raw = localStorage.getItem('cpt_force_fetch');
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            if (parsed && parsed.ts) { req = parsed; source = 'localStorage'; }
                        }
                    } catch {}
                }

                // Her 30sn'de bir "hayatta" logu — sinyal handler çalışıyor mu test etmek için
                _heartbeatCounter++;
                if (_heartbeatCounter % 150 === 0) {  // 200ms × 150 = 30sn
                    dlog('💓 force_fetch handler aktif (Rodeo ExSD)');
                }

                if (!req?.ts) return;

                let lastSeen = 0;
                try { lastSeen = parseInt(localStorage.getItem(SEEN_KEY) || '0'); } catch {}
                if (req.ts <= lastSeen) return;
                if (Date.now() - req.ts > 30000) {
                    dlog(`⏰ Eski sinyal yoksayıldı (${Math.round((Date.now()-req.ts)/1000)}sn önce)`);
                    return;
                }

                try { localStorage.setItem(SEEN_KEY, String(req.ts)); } catch {}

                dlog(`🔔 Sinyal alındı [${source}] what=${req.what} ts=${req.ts}`);

                if (req.what === 'transit-reload' || req.what === 'all') {
                    // v10.72: 'all' (header Yenile) de transit'i tazeler — tek tıkla TÜM sayfalar.
                    // v10.59: Eskiden location.reload() yapıyorduk ama arka plan sekmesinde
                    // reload throttle'lanıp parse gecikiyordu. Artık DOĞRUDAN fetch çalıştırıyoruz —
                    // reload'a gerek yok, sayfa zaten açık ve DOM güncel. Çok daha hızlı + güvenilir.
                    dlog('🔄 Veriyi Çek sinyali → doğrudan runTransitFetch (reload yok)');
                    runTransitFetch();
                    // Ek güvence: DOM henüz tam güncel değilse 1.5sn sonra bir daha
                    setTimeout(() => { try { runTransitFetch(); } catch(e) {} }, 1500);
                } else if (req.what === 'transit') {
                    dlog('🔔 Force fetch sinyali alındı (Rodeo ExSD)');
                    runTransitFetch();
                }
            } catch (e) {
                dlog('⚠ force fetch handler hata:', String(e));
            }
        }, 200);

        // Tampermonkey menüsünden manuel tetikleme
        try {
            if (typeof GM_registerMenuCommand === 'function') {
                GM_registerMenuCommand('🚚 Transit fetch (Rodeo ExSD)', runTransitFetch);
            }
        } catch {}

        // ═══════════════════════════════════════════════════════════════
        // OTOMATİK SAYFA YENİLEME (Rodeo ExSD)
        // Her 1 dakikada bir sayfa kendiliğinden yenilenir.
        // "Veri Çek" butonuna manuel basmaya gerek kalmaz.
        // Kullanıcı sayfada aktif veri yazıyorsa (input focus) ertelenir.
        // ═══════════════════════════════════════════════════════════════
        const AUTO_RELOAD_MS = 60 * 1000;  // 1 dakika
        let _lastReload = Date.now();
        setInterval(() => {
            try {
                // 1 dk dolmadıysa atla
                if (Date.now() - _lastReload < AUTO_RELOAD_MS) return;

                // Kullanıcı bir input veya textarea'da yazıyor mu? — yenilemeyi ertele
                const ae = document.activeElement;
                const isTyping = ae && (
                    ae.tagName === 'INPUT' ||
                    ae.tagName === 'TEXTAREA' ||
                    ae.tagName === 'SELECT' ||
                    ae.isContentEditable
                );
                if (isTyping) {
                    dlog('⏸ Otomatik yenileme ertelendi — kullanıcı input\'ta yazıyor');
                    return;
                }

                _lastReload = Date.now();
                dlog('🔄 Rodeo ExSD otomatik yenileme — 1 dakika doldu');
                location.reload();
            } catch (e) {
                dlog('⚠ otomatik yenileme hata:', String(e));
            }
        }, 10 * 1000);  // her 10sn kontrol et (1dk tamamlandı mı?)

        dlog('🚚 Transit fetcher hazır — 200ms içinde ilk fetch (öncelikli), sonra 25sn tam + 8sn hafif refresh, 1dk\'da bir otomatik sayfa yenileme');
    })();
}

// ── Refresh sinyali (tüm picking/rodeo sayfaları) ──
if(IS_PICKING||IS_RODEO) {
    let _sig='';
    try{_sig=GM_getValue('cpt_refresh_signal','');}catch(e){}
    setInterval(()=>{
        try{const s=GM_getValue('cpt_refresh_signal','');if(s&&s!==_sig){_sig=s;GM_setValue('cpt_refresh_signal','');location.reload();}}catch(e){}
    },2000);
}

// ═══════════════════════════════════════════════════════════════
//  IS_SORTATION — flow-sortation-eu (v10.37)
//  v10.37: Sortation Angular SPA — URL hash değişimini dinler,
//  her #/buffer/current-status'a girildiğinde DOM scrape başlatır.
//  Diğer Sortation sayfalarında (Welcome, AWCS, Routing) sessiz bekler.
// ═══════════════════════════════════════════════════════════════
if (IS_SORTATION && !IS_IFRAME) {
    dlog('🟢 Sortation bloğu yüklendi (URL:', location.hash || location.pathname, ')');

    // Buffer Current Status sayfasında mıyız? (hash veya path)
    function isOnBufferPage() {
        const h = location.hash || '';
        const p = location.pathname || '';
        return h.includes('/buffer/current-status') || p.includes('/buffer/current-status');
    }

    // v10.33: Doğru tabloyu bul — header'da "Batch ID" + "ExSD" + "Pick Status" hepsi geçmeli.
    // "Buffers By Destination" tablosu sadece "Destination/Free Buffers..." vb. başlıklar içerir.
    function findBatchTable() {
        const tables = document.querySelectorAll('table');
        let best = null, bestScore = 0;
        for (const tbl of tables) {
            const headers = [...tbl.querySelectorAll('thead th, th')].map(th => th.textContent.trim().toLowerCase());
            let score = 0;
            if (headers.some(h => /batch\s*id/.test(h))) score += 3;
            if (headers.some(h => /exsd/.test(h)))       score += 2;
            if (headers.some(h => /pick\s*status/.test(h))) score += 2;
            if (headers.some(h => /buffer/.test(h) && !/buffers\s+by/.test(h))) score += 1;
            if (score > bestScore) { bestScore = score; best = tbl; }
        }
        // En az 5 puan toplamış olmalı (Batch ID + ExSD veya Pick Status zorunlu)
        return bestScore >= 5 ? best : null;
    }

    // Buffer sayfasından bir satır parse et
    // v10.36: Header'lara göre kolon index'lerini hesapla — sıra değişse bile bozulmaz
    let _colIdx = null;
    function calcColumnIndexes(tbl) {
        const headers = [...tbl.querySelectorAll('thead th, thead td, tr:first-child th')]
            .map(th => th.textContent.trim().toLowerCase());
        const find = (rx) => headers.findIndex(h => rx.test(h));
        _colIdx = {
            batchId:    find(/batch\s*id/),
            buffer:     find(/^buffer$/),
            exsd:       find(/exsd|need\s*by/),
            hhmm:       find(/hh:mm|since\s*assigned/),
            pickStatus: find(/pick\s*status/),
            buffStatus: find(/buffer\s*status/),
            sortCode:   find(/sort\s*code/),
            totalU:     find(/total\s*units?/),
            cptU:       find(/cpt\s*units?/),
            pnyp:       find(/pnyp/),
            totes:      find(/totes?\s*all/)
        };
        dlog('📊 Buffer kolon indexleri:', JSON.stringify(_colIdx));
        return _colIdx;
    }

    // Esnek ExSD parser: "2026-05-23 18:30:00", "5/23/2026 6:30 PM", ISO vs.
    function parseExsdToTs(s) {
        if (!s) return 0;
        // 1) Native Date parse
        const d = new Date(s);
        if (!isNaN(d.getTime())) return d.getTime();
        // 2) "YYYY-MM-DD HH:MM" pattern
        const m = s.match(/(\d{4})-(\d{2})-(\d{2})[\sT]+(\d{1,2}):(\d{2})/);
        if (m) return new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5]).getTime();
        // 3) "M/D/YYYY H:MM AM/PM" pattern
        const m2 = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
        if (m2) {
            let hh = +m2[4]; const ap = (m2[6]||'').toUpperCase();
            if (ap === 'PM' && hh < 12) hh += 12;
            if (ap === 'AM' && hh === 12) hh = 0;
            return new Date(+m2[3], +m2[1]-1, +m2[2], hh, +m2[5]).getTime();
        }
        return 0;
    }

    function parseBufferRow(row) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) return null;
        // Kolon index map yoksa default'a düş (eski davranış)
        const ci = _colIdx || { batchId:0, buffer:1, exsd:2, hhmm:3, pickStatus:5, buffStatus:6, sortCode:7, totalU:8, cptU:9, pnyp:10, totes:11 };

        const get = (i) => i >= 0 && i < cells.length ? cells[i]?.textContent.trim() || '' : '';

        const batchLink = cells[ci.batchId >= 0 ? ci.batchId : 0]?.querySelector('a');
        const batchId = batchLink?.textContent.trim() || get(ci.batchId >= 0 ? ci.batchId : 0);
        if (!batchId || !/^\d+$/.test(batchId)) return null;

        const buffer    = get(ci.buffer);
        const exsdStr   = get(ci.exsd);
        const hhmmLeft  = get(ci.hhmm);
        const pickStatus= get(ci.pickStatus);
        const buffStatus= get(ci.buffStatus);
        const sortCode  = get(ci.sortCode);
        const totalU    = parseInt(get(ci.totalU).replace(/\D/g,'')) || 0;
        const cptU      = parseInt(get(ci.cptU).replace(/\D/g,''))   || 0;
        const pnyp      = parseInt(get(ci.pnyp).replace(/\D/g,''))   || 0;
        const totes     = parseInt(get(ci.totes).replace(/\D/g,''))  || 0;

        // ExSD → epoch ms
        const cptTs = parseExsdToTs(exsdStr);
        let cptLabel = '';
        if (cptTs > 0) {
            const d = new Date(cptTs);
            cptLabel = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
        }

        return {
            batchId, buffer, cptTs, cptLabel, hhmmLeft,
            pickStatus, buffStatus, sortCode,
            totalU, cptU, pnyp, totes
        };
    }

    // Sayfayı parse et
    function pushBuffer() {
        const tbl = findBatchTable();
        if (!tbl) {
            dlog('⚠️ Buffer: "Batch ID" header\'lı tablo bulunamadı');
            return;
        }

        // v10.36: Header'lara göre kolon indekslerini hesapla
        calcColumnIndexes(tbl);

        // v10.33: Önce ng-repeat="batch in batchSummaries..." satırlarını dene (kesin doğru).
        // Sonra ng-scope, sonra ng-repeat herhangi, son çare olarak tüm tbody tr.
        // CRITICAL: td'si olmayan satırları (template, boş tr) at!
        let rows = [...tbl.querySelectorAll('tbody tr[ng-repeat*="batchSummaries"]')];
        if (!rows.length) rows = [...tbl.querySelectorAll('tbody tr.ng-scope')];
        if (!rows.length) rows = [...tbl.querySelectorAll('tbody tr[ng-repeat]')];
        if (!rows.length) rows = [...tbl.querySelectorAll('tbody tr')];
        rows = rows.filter(r => r.querySelectorAll('td').length > 0 && r.offsetParent !== null);
        if (!rows.length) {
            dlog('⚠️ Buffer: TD\'li satır bulunamadı (henüz yüklenmemiş olabilir)');
            return;
        }

        const all = [];
        let skipped = 0;
        let firstCellCount = 0;
        rows.forEach((r, i) => {
            if (i === 0) firstCellCount = r.querySelectorAll('td').length;
            const parsed = parseBufferRow(r);
            if (parsed) all.push(parsed);
            else skipped++;
        });

        // Sadece complete batch'leri ayrı tut
        const completeBatches = all.filter(b => b.pickStatus === 'PickComplete');

        // Üst kutucuktan toplam complete batch sayısını da çek
        let totalComplete = 0;
        try {
            const el = document.getElementById('ist2-open-complete');
            if (el) totalComplete = parseInt(el.textContent.trim()) || 0;
        } catch(e) {}
        if (!totalComplete) totalComplete = completeBatches.length;

        // Ekstra metrik kutucukları (Progress/Transit/Destination/ProgressTote vs.)
        const extras = {};
        const ids = [
            'ist2-mmz-progress','ist2-mmz-transit','ist2-mmz-destination',
            'ist2-tote-progress','ist2-tote-transit','ist2-tote-destination',
            'ist2-open-cpt','ist2-open-pnyp'
        ];
        ids.forEach(id => {
            try {
                const el = document.getElementById(id);
                if (el) extras[id] = parseInt(el.textContent.trim()) || 0;
            } catch(e) {}
        });

        const payload = {
            data: completeBatches,
            allData: all,         // tüm batch'ler (PickStarted dahil)
            totalComplete,
            extras,
            ts: Date.now()
        };

        // v10.36: Sağlık kontrolü — uyar ama cache'i yaz (Batch ID'ler en azından görünür).
        // Eskiden "withCpt === 0" durumunda cache yazılmıyordu, bu da Sortation'ın bomboş kalmasına sebep oluyordu.
        const withCpt = all.filter(b => b.cptTs > 0).length;
        if (all.length > 0 && withCpt === 0) {
            dlog(`⚠️ Buffer: ${all.length} batch parse edildi ama HİÇBİRİNDE cptTs YOK — ExSD parse edilemiyor olabilir`);
            dlog('   ExSD raw (ilk 3 satır):',
                rows.slice(0,3).map(r => {
                    const idx = _colIdx?.exsd ?? 2;
                    const tds = r.querySelectorAll('td');
                    return JSON.stringify(tds[idx]?.textContent.trim() || '(yok)');
                }).join(' | '));
            dlog('   Kolon idx:', JSON.stringify(_colIdx));
        }

        push('cpt_complete_batches_v1', payload);
        dlog(`📦 Buffer: ${rows.length} satır, ilk satır ${firstCellCount} hücre, ${all.length} parse OK (${withCpt} CPT'li), ${skipped} atlandı, ${completeBatches.length} complete (toplam: ${totalComplete})`);
    }

    // v10.37: Sadece Buffer Current Status sayfasındayken parse yap
    function tryPushBuffer() {
        if (!isOnBufferPage()) return;
        pushBuffer();
    }

    setTimeout(tryPushBuffer, 800);
    setInterval(tryPushBuffer, 4000);
    let _bufObserver = null;
    function observeBuffer() {
        if (!isOnBufferPage()) { setTimeout(observeBuffer, 1500); return; }
        const tbl = findBatchTable();
        if (!tbl) { setTimeout(observeBuffer, 1000); return; }
        // Eski observer varsa kapat (SPA navigation sonrası)
        try { _bufObserver?.disconnect(); } catch(e) {}
        _bufObserver = new MutationObserver(() => {
            clearTimeout(window._bufT);
            window._bufT = setTimeout(tryPushBuffer, 200);
        });
        _bufObserver.observe(tbl, { childList:true, subtree:true, characterData:true });
        dlog('🔍 Buffer observer kuruldu (URL:', location.hash, ')');
    }
    setTimeout(observeBuffer, 1500);

    // v10.37: Hash route change dinleyici — Angular SPA navigation desteği.
    // Sortation içinde başka sayfadan Buffer'a geçince observer'ı yeniden kur.
    let _lastHash = location.hash;
    function onRouteChange() {
        if (location.hash === _lastHash) return;
        _lastHash = location.hash;
        dlog('🔄 Route değişti:', _lastHash);
        if (isOnBufferPage()) {
            dlog('   → Buffer sayfasına gelindi, observer yeniden kuruluyor...');
            setTimeout(observeBuffer, 1000);
            setTimeout(tryPushBuffer, 1500);
        }
    }
    window.addEventListener('hashchange', onRouteChange);
    window.addEventListener('popstate', onRouteChange);
    // Angular pushState'i de yakalamak için periyodik kontrol
    setInterval(onRouteChange, 2000);

    // v10.29: Tampermonkey menü — manuel test
    try {
        GM_registerMenuCommand('🧪 Buffer parse test (console\'a yaz)', () => {
            const tbl = findBatchTable();
            if (!tbl) { alert('Batch ID tablosu bulunamadı.'); return; }
            const rowsA = tbl.querySelectorAll('tbody tr.ng-scope');
            const rowsB = tbl.querySelectorAll('tbody tr[ng-repeat]');
            const rowsC = tbl.querySelectorAll('tbody tr');
            console.log('[CPT10 Buffer test]');
            console.log('  tr.ng-scope:', rowsA.length);
            console.log('  tr[ng-repeat]:', rowsB.length);
            console.log('  tr:', rowsC.length);
            console.log('  İlk satır cell sayısı:', rowsC[0]?.querySelectorAll('td').length || 0);
            if (rowsC[0]) {
                console.log('  İlk satır cell texts:',
                    [...rowsC[0].querySelectorAll('td')].map(td => td.textContent.trim()));
            }
            pushBuffer();
            const cache = JSON.parse(localStorage.getItem('cpt_complete_batches_v1')||'null');
            console.log('  cache:', cache);
            alert('Console\'a yazıldı. F12 → Console.');
        });
    } catch(e) {}

    // v10.39: Batch Detay HTML fetch testi — SPA scrape mümkün mü?
    try {
        GM_registerMenuCommand('🔬 Batch Detay HTML testi', () => {
            const batchId = prompt('Test edilecek batch ID:', '48570107');
            if (!batchId) return;
            console.log('═══ [CPT10] Batch Detay HTML Testi ═══');
            console.log('Batch ID:', batchId);
            const url = `https://flow-sortation-eu.amazon.com/IST2/#/buffer/batch-details/${batchId}`;
            console.log('URL:', url);
            const t0 = Date.now();
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload(r) {
                    const dt = Math.round((Date.now()-t0)/100)/10;
                    console.log(`HTTP: ${r.status} (${dt}sn)`);
                    console.log('Boyut:', r.responseText.length, 'byte');
                    console.log('Tote ID "tsX" var mı:', r.responseText.includes('tsX'));
                    console.log('"buffered-totes" id var mı:', r.responseText.includes('buffered-totes'));
                    console.log('"missed-totes" id var mı:', r.responseText.includes('missed-totes'));
                    console.log('Angular template "{{":', (r.responseText.match(/\{\{/g)||[]).length, 'adet');
                    console.log('İlk 800 karakter:');
                    console.log(r.responseText.substring(0, 800));

                    const hasTotes = r.responseText.includes('tsX');
                    alert(hasTotes
                        ? `✅ HTML scrape MÜMKÜN!\nResponse: ${r.responseText.length} byte\nTote ID'leri var.\nConsole'a tam çıktı yazıldı.`
                        : `❌ HTML SPA shell — tote ID'leri YOK.\nResponse: ${r.responseText.length} byte\nAngular template render etmiyor.\nAlternatif gerekiyor (JSON API veya iframe).\nConsole'a tam çıktı yazıldı.`);
                },
                onerror(e) {
                    console.error('Hata:', e);
                    alert('❌ Hata: ' + JSON.stringify(e).substring(0, 200));
                },
                ontimeout() {
                    console.log('Timeout');
                    alert('❌ Timeout (12sn)');
                },
                timeout: 12000
            });
        });

        // Aynı zamanda JSON endpoint denesi
        GM_registerMenuCommand('🔬 Batch Detay JSON endpoint testi', () => {
            const batchId = prompt('Test edilecek batch ID:', '48570107');
            if (!batchId) return;
            console.log('═══ [CPT10] Batch Detay JSON endpoint Testi ═══');
            const endpoints = [
                `https://flow-sortation-eu.amazon.com/IST2/batch-buffer/batch-details/${batchId}`,
                `https://flow-sortation-eu.amazon.com/IST2/batch-buffer/details?batchId=${batchId}`,
                `https://flow-sortation-eu.amazon.com/IST2/batches/${batchId}`,
                `https://flow-sortation-eu.amazon.com/IST2/batches/${batchId}/totes`,
                `https://flow-sortation-eu.amazon.com/IST2/batch/${batchId}/details`
            ];
            const results = [];
            let done = 0;
            endpoints.forEach((url, i) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    headers: { 'Accept': 'application/json' },
                    timeout: 8000,
                    onload(r) {
                        const status = r.status;
                        const size = r.responseText.length;
                        const hasJson = r.responseText.trim().startsWith('{') || r.responseText.trim().startsWith('[');
                        const hasTote = r.responseText.includes('tsX');
                        const result = `[${i}] HTTP ${status} · ${size}B · JSON:${hasJson?'✓':'✗'} · Tote:${hasTote?'✓':'✗'}\n    ${url}`;
                        console.log(result);
                        if (hasJson && size < 2000) {
                            console.log('    İçerik:', r.responseText.substring(0, 500));
                        }
                        results.push({ url, status, size, hasJson, hasTote });
                        if (++done === endpoints.length) {
                            const winner = results.find(r => r.hasJson && r.hasTote);
                            alert(winner
                                ? `✅ Çalışan endpoint bulundu!\n${winner.url}\nConsole'a bak.`
                                : `❌ Hiçbir endpoint çalışmadı.\nTüm sonuçları console'da gör.`);
                        }
                    },
                    onerror() { console.log(`[${i}] HATA: ${url}`); if (++done === endpoints.length) alert('Test tamamlandı, console\'a bak.'); },
                    ontimeout() { console.log(`[${i}] TIMEOUT: ${url}`); if (++done === endpoints.length) alert('Test tamamlandı, console\'a bak.'); }
                });
            });
        });
    } catch(e) {}

    // v10.31: Manuel Buffer fetch komutu (Rodeo ExSD'deki gibi)
    try {
        if (typeof GM_registerMenuCommand === 'function') {
            GM_registerMenuCommand('📦 Buffer fetch (Sortation)', () => {
                dlog('📦 Buffer fetch manuel tetiklendi (Tampermonkey menü)');
                pushBuffer();
            });
        }
    } catch(e) {}

    // v10.31: Force fetch sinyali dinleyici — başka sayfadan "Test fetchBuffer" komutu çalışırsa burası tetiklenir
    let _lastBufSig = 0;
    setInterval(() => {
        try {
            const req = GM_getValue('cpt_force_fetch_buffer_gm', null);
            if (!req || !req.ts || req.ts <= _lastBufSig) return;
            _lastBufSig = req.ts;
            dlog('🔔 Buffer force fetch sinyali alındı');
            if (req.what === 'buffer-reload') {
                dlog('🔄 Buffer sayfası F5 ile yenileniyor');
                setTimeout(() => location.reload(), 100);
            } else {
                pushBuffer();
            }
        } catch(e) {}
    }, 200);

    // v10.31: Otomatik sayfa yenileme — 1 dakikada bir Buffer sayfası kendiliğinden yenilenir
    // (AngularJS sayfası bazen veri donduruyor; F5 daha güvenilir)
    const BUF_AUTO_RELOAD_MS = 60 * 1000;
    let _lastBufReload = Date.now();
    setInterval(() => {
        try {
            if (Date.now() - _lastBufReload < BUF_AUTO_RELOAD_MS) return;
            const ae = document.activeElement;
            const isTyping = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable);
            if (isTyping) {
                dlog('⏸ Buffer otomatik yenileme ertelendi — kullanıcı input\'ta yazıyor');
                return;
            }
            _lastBufReload = Date.now();
            dlog('🔄 Buffer otomatik yenileme (60sn)');
            location.reload();
        } catch(e) {}
    }, 5000);

    // ═══════════════════════════════════════════════════════════════
    // v10.40: SORTATION BATCH DETAY → tote listesi + FC Research enrichment
    // Buffer Current Status sayfası AÇIK iken çalışır (same-origin iframe).
    // Iframe ile Sortation batch detay sayfasını arka planda aç,
    // tote ID'leri parse et, FC Research'ten her tote için employee + lastPick çek.
    // Cache: cpt_batch_totes_v1 = { [batchId]: { totes:[...], ts } }
    // ═══════════════════════════════════════════════════════════════
    const BATCH_DETAIL_TTL = 5 * 60 * 1000;
    const BATCH_PARSE_TIMEOUT = 8000;

    function readBatchTotesCache_S() {
        try { return JSON.parse(localStorage.getItem('cpt_batch_totes_v1') || 'null') || {}; }
        catch(e) { return {}; }
    }
    function writeBatchTotesCache_S(cache) {
        try { localStorage.setItem('cpt_batch_totes_v1', JSON.stringify(cache)); } catch(e) {}
        try { GM_setValue('cpt_batch_totes_v1', cache); } catch(e) {}
        try { bc()?.postMessage({ key:'cpt_batch_totes_v1', value: JSON.stringify(cache) }); } catch(e) {}
    }

    // İlk olarak GM_xmlhttpRequest ile dene (hızlı, eğer SPA HTML'inde tote ID'ler varsa)
    function fetchBatchDetailHTML_Direct(batchId) {
        return new Promise((resolve) => {
            try {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `https://flow-sortation-eu.amazon.com/IST2/#/buffer/batch-details/${batchId}`,
                    timeout: 8000,
                    onload(r) {
                        if (r.status !== 200) return resolve(null);
                        // Tote ID pattern arama
                        const tsMatches = r.responseText.match(/ts[A-Z0-9]{8,}/gi);
                        if (!tsMatches || tsMatches.length < 1) return resolve(null);
                        resolve(r.responseText);
                    },
                    onerror() { resolve(null); },
                    ontimeout() { resolve(null); }
                });
            } catch(e) { resolve(null); }
        });
    }

    // Iframe ile Sortation batch detay sayfasından tote ID'leri, status, lokasyon ve picker'ı çek
    // ÖNEMLİ: Sayfa Totes_location-X scripti tarafından zaten zenginleştirilmiş.
    // "Not Yet Buffered Totes" tablosunda her satırda <td id="_LastPick">, <td id="_Employee">,
    // <td id="_Dwelltime"> var. Buffered Totes'ta sadece tote ID var.
    function fetchBatchDetailTotes_S(batchId) {
        return new Promise((resolve) => {
            const url = `https://flow-sortation-eu.amazon.com/IST2/#/buffer/batch-details/${batchId}`;
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1400px;height:900px;border:0;visibility:hidden;pointer-events:none';
            iframe.src = url;
            let done = false;
            const cleanup = () => {
                if (done) return; done = true;
                try { iframe.remove(); } catch(e) {}
            };
            const timer = setTimeout(() => {
                if (!done) { dlog(`⏱ Batch ${batchId}: iframe timeout`); tryParse(); }
            }, BATCH_PARSE_TIMEOUT);

            function tryParse() {
                if (done) return;
                try {
                    const idoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (!idoc) { cleanup(); return resolve([]); }
                    const totes = [];

                    // 1) BUFFERED TOTES — sadece tote ID var (zaten toplanmış, buffer'a girmiş)
                    const bufTbl = idoc.getElementById('buffered-totes');
                    if (bufTbl) {
                        bufTbl.querySelectorAll('tbody tr.ng-scope, tr[ng-repeat*="bufferedTotes"]').forEach(tr => {
                            const link = tr.querySelector('a');
                            const toteId = (link?.textContent || '').trim();
                            if (/^ts[A-Z0-9]{8,}$/i.test(toteId)) {
                                totes.push({
                                    toteId,
                                    status: 'picked',     // buffered = toplandı
                                    employee: '',         // bu tabloda yok
                                    lastPick: '',
                                    location: '',
                                    units: 0,
                                    dwelltime: '',
                                    floor: ''
                                });
                            }
                        });
                    }

                    // 2) NOT YET BUFFERED TOTES — Totes_location-X enrichment var!
                    //    Her satırda: <a>toteId</a>, <td id="LocationID">, <td id="_LastPick">,
                    //                 <td id="_Employee">, <td id="_Units">, <td id="_Dwelltime">
                    const missTbl = idoc.getElementById('missed-totes');
                    if (missTbl) {
                        missTbl.querySelectorAll('tbody tr.ng-scope, tr[ng-repeat*="missedTotes"]').forEach(tr => {
                            const link = tr.querySelector('a[href*="fcresearch"], a[href*="results?s="]');
                            const toteId = (link?.textContent || '').trim();
                            if (!/^ts[A-Z0-9]{8,}$/i.test(toteId)) return;
                            const getById = (id) => {
                                const el = tr.querySelector(`#${id}`) || tr.querySelector(`td[id="${id}"]`);
                                return el ? el.textContent.trim() : '';
                            };
                            totes.push({
                                toteId,
                                status: 'missing',
                                employee:  getById('_Employee'),
                                lastPick:  getById('_LastPick'),
                                location:  getById('LocationID'),
                                units:     parseInt(getById('_Units'), 10) || 0,
                                dwelltime: getById('_Dwelltime'),
                                floor: ''
                            });
                        });
                    }

                    // 3) PICKED TOTES — varsa (henüz toplanmamış)
                    const pickTbl = idoc.getElementById('picked-totes');
                    if (pickTbl) {
                        pickTbl.querySelectorAll('tbody tr.ng-scope, tr[ng-repeat*="pickTotes"]').forEach(tr => {
                            const link = tr.querySelector('a');
                            const toteId = (link?.textContent || '').trim();
                            if (/^ts[A-Z0-9]{8,}$/i.test(toteId)) {
                                totes.push({
                                    toteId, status: 'pre-pick',
                                    employee: '', lastPick: '', location: '',
                                    units: 0, dwelltime: '', floor: ''
                                });
                            }
                        });
                    }

                    clearTimeout(timer);
                    cleanup();
                    dlog(`🔍 Batch ${batchId} iframe: ${totes.length} tote (${totes.filter(t=>t.status==='picked').length} buffered, ${totes.filter(t=>t.status==='missing').length} not-yet-buffered, ${totes.filter(t=>t.employee).length} picker)`);
                    resolve(totes);
                } catch(e) {
                    dlog(`Batch ${batchId} iframe parse hatası:`, e?.message);
                    clearTimeout(timer); cleanup(); resolve([]);
                }
            }
            iframe.addEventListener('load', () => setTimeout(tryParse, 5000));  // Angular + Totes_location-X enrich için 5sn
            iframe.addEventListener('error', () => { clearTimeout(timer); cleanup(); resolve([]); });
            document.body.appendChild(iframe);
        });
    }

    function parseFloorFromLoc_S(loc) {
        if (!loc) return '';
        const m = String(loc).match(/^P-?(\d)/i);
        return m ? 'P' + m[1] : '';
    }

    async function enrichBatchTotes_S(batchId, force) {
        const cache = readBatchTotesCache_S();
        const prev = cache[batchId];
        if (!force && prev && (Date.now() - prev.ts) < BATCH_DETAIL_TTL) return prev;

        const totes = await fetchBatchDetailTotes_S(batchId);
        if (!totes.length) {
            cache[batchId] = { batchId, totes: [], ts: Date.now(), error: 'no-totes' };
            writeBatchTotesCache_S(cache);
            return cache[batchId];
        }

        // FC Research fallback — Totes_location-X çalışmadıysa (ki iframe'de çoğunlukla çalışmaz)
        // tüm tote'lar için FC Research'ten picker + lastPick çek
        const needsFc = totes.filter(t => !t.employee || !t.lastPick);
        dlog(`   FC Research enrichment gerekli: ${needsFc.length}/${totes.length} tote`);
        if (needsFc.length > 0) {
            await _enrichTotesWithFc(needsFc, 4);
        }

        // Floor parse: önce lastPick, yoksa location
        totes.forEach(t => {
            t.floor = parseFloorFromLoc_S(t.lastPick || t.location);
        });

        cache[batchId] = { batchId, totes, ts: Date.now() };
        writeBatchTotesCache_S(cache);
        dlog(`✅ Batch ${batchId} enriched: ${totes.length} tote, ${totes.filter(t=>t.employee).length} picker, ${totes.filter(t=>t.lastPick).length} location`);
        return cache[batchId];
    }

    let _enrichmentLoopRunning_S = false;
    async function enrichmentLoop_S() {
        if (_enrichmentLoopRunning_S) return;
        if (!isOnBufferPage()) return;
        _enrichmentLoopRunning_S = true;
        try {
            const sortCache = JSON.parse(localStorage.getItem('cpt_complete_batches_v1') || 'null');
            if (!sortCache || !sortCache.allData) { _enrichmentLoopRunning_S = false; return; }
            const candidates = sortCache.allData
                .filter(b => b.batchId && (b.pickStatus === 'PickStarted' || b.pickStatus === 'PickComplete'))
                .slice(0, 30);
            const toteCache = readBatchTotesCache_S();
            for (const b of candidates) {
                const prev = toteCache[b.batchId];
                if (prev && (Date.now() - prev.ts) < BATCH_DETAIL_TTL) continue;
                await enrichBatchTotes_S(b.batchId);
                await new Promise(r => setTimeout(r, 2500));
            }
        } catch(e) { dlog('enrichmentLoop_S hata:', e?.message); }
        _enrichmentLoopRunning_S = false;
    }

    // Buffer sayfası açıkken 15sn sonra başla, sonra 3 dakikada bir
    setTimeout(enrichmentLoop_S, 15000);
    setInterval(enrichmentLoop_S, 180000);

    // Manuel test menüleri
    try {
        if (typeof GM_registerMenuCommand === 'function') {
            GM_registerMenuCommand('🔬 Batch totes enrich (manuel)', async () => {
                const batchId = prompt('Hangi batch ID için enrich edilsin?', '');
                if (!batchId) return;
                alert('Enrichment başladı (~10sn). Console\'a bak.');
                const r = await enrichBatchTotes_S(batchId, true);
                alert(`✓ ${r.totes.length} tote\nPicker bilgisi: ${r.totes.filter(t=>t.employee).length}`);
            });
            GM_registerMenuCommand('🔄 Tüm batch totes enrich (loop)', () => {
                enrichmentLoop_S();
                alert('Enrichment loop başlatıldı. ~2-5 dakika sürebilir.');
            });
        }
    } catch(e) {}

    dlog('🟢 Sortation batch enrichment aktif (Buffer sayfası açıkken)');
}


})();