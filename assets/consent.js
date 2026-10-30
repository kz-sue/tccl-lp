/*
 * Google Analytics (gtag.js) の読み込みと Cookie 同意バナー。
 *
 * - EEA・英国・スイスの訪問者（ブラウザのタイムゾーンで判定）には同意バナーを表示し、
 *   同意が得られるまで Google アナリティクスを読み込まない（同意モード「基本」実装）。
 * - それ以外の地域の訪問者には、バナーを出さずに通常どおり計測する。
 * - Google 同意モードの region 指定により、タイムゾーン判定をすり抜けた EEA 等の訪問者も
 *   Google 側の地域判定で Cookie 利用が拒否される（保険）。
 * - 選択結果は localStorage に保存し、プライバシーポリシーのリンクから変更できる。
 */
(function () {
  var GA_ID = 'G-4ZSHEN2KXC';
  var STORAGE_KEY = 'tccl_consent';
  var PRIVACY_URL = '/privacy/#site-cookies';
  var PRIVACY_URL_EN = '/privacy/en/#site-cookies';

  // EEA 30か国 + 英国 + スイス（ISO 3166-1 alpha-2）
  var CONSENT_REGIONS = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
    'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    'IS', 'LI', 'NO', 'GB', 'CH'
  ];

  var script = document.currentScript;
  var showBanner = !(script && script.hasAttribute('data-no-banner'));

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  // --- 同意が必要な地域かどうか（タイムゾーンによる簡易判定） ---
  function requiresConsent() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      return /^Europe\//.test(tz) ||
        /^Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe|Faeroe)$/.test(tz);
    } catch (e) {
      return false;
    }
  }

  function readChoice() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function saveChoice(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* ignore */ }
  }

  // --- 同意モードの初期値 ---
  // EEA 等（Google 側の地域判定）: すべて拒否。その他: 分析用のみ許可。広告系は常に拒否。
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    region: CONSENT_REGIONS,
    wait_for_update: 500
  });
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted'
  });

  var loaded = false;
  function loadAnalytics() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  var needsConsent = requiresConsent();
  var choice = readChoice();

  function grant() {
    saveChoice('granted');
    gtag('consent', 'update', { analytics_storage: 'granted' });
    loadAnalytics();
  }
  function deny() {
    saveChoice('denied');
    gtag('consent', 'update', { analytics_storage: 'denied' });
  }

  // --- バナー ---
  var TEXT = {
    ja: {
      message: '当サイトでは、利用状況の把握と改善のために Google アナリティクスの Cookie を使用します。',
      link: '詳細',
      accept: '同意する',
      reject: '拒否する',
      privacy: PRIVACY_URL
    },
    en: {
      message: 'This site uses Google Analytics cookies to understand how it is used and to improve it.',
      link: 'Learn more',
      accept: 'Accept',
      reject: 'Decline',
      privacy: PRIVACY_URL_EN
    }
  };

  var bannerEl = null;
  function removeBanner() {
    if (bannerEl && bannerEl.parentNode) bannerEl.parentNode.removeChild(bannerEl);
    bannerEl = null;
  }
  function renderBanner() {
    if (bannerEl) return;
    var lang = (document.documentElement.lang || 'ja').toLowerCase().indexOf('en') === 0 ? 'en' : 'ja';
    var t = TEXT[lang];

    if (!document.getElementById('tccl-consent-style')) {
      var style = document.createElement('style');
      style.id = 'tccl-consent-style';
      style.textContent =
        '#tccl-consent{position:fixed;left:0;right:0;bottom:0;z-index:1000;background:#2c4a6d;color:#fff;' +
        'font-family:-apple-system,BlinkMacSystemFont,"Hiragino Kaku Gothic ProN","Hiragino Sans",Meiryo,sans-serif;' +
        'font-size:0.9rem;line-height:1.6;padding:14px 16px;box-shadow:0 -2px 8px rgba(0,0,0,.15)}' +
        '#tccl-consent .tccl-consent-inner{max-width:760px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px}' +
        '#tccl-consent p{margin:0;flex:1 1 320px}' +
        '#tccl-consent a{color:#fff}' +
        '#tccl-consent .tccl-consent-buttons{display:flex;gap:8px;flex:none}' +
        '#tccl-consent button{font:inherit;font-size:0.85rem;padding:6px 16px;border-radius:6px;cursor:pointer;border:1px solid #fff}' +
        '#tccl-consent .tccl-accept{background:#fff;color:#2c4a6d;font-weight:700}' +
        '#tccl-consent .tccl-reject{background:transparent;color:#fff}';
      document.head.appendChild(style);
    }

    bannerEl = document.createElement('div');
    bannerEl.id = 'tccl-consent';
    bannerEl.setAttribute('role', 'dialog');
    bannerEl.setAttribute('aria-live', 'polite');
    bannerEl.innerHTML =
      '<div class="tccl-consent-inner">' +
      '<p></p>' +
      '<div class="tccl-consent-buttons">' +
      '<button type="button" class="tccl-reject"></button>' +
      '<button type="button" class="tccl-accept"></button>' +
      '</div></div>';
    var p = bannerEl.querySelector('p');
    p.appendChild(document.createTextNode(t.message + ' '));
    var a = document.createElement('a');
    a.href = t.privacy;
    a.textContent = t.link;
    p.appendChild(a);
    bannerEl.querySelector('.tccl-accept').textContent = t.accept;
    bannerEl.querySelector('.tccl-reject').textContent = t.reject;
    bannerEl.querySelector('.tccl-accept').addEventListener('click', function () { grant(); removeBanner(); });
    bannerEl.querySelector('.tccl-reject').addEventListener('click', function () { deny(); removeBanner(); });
    document.body.appendChild(bannerEl);
  }
  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  // --- 起動時の判断 ---
  if (!needsConsent) {
    loadAnalytics();
  } else if (choice === 'granted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    loadAnalytics();
  } else if (choice !== 'denied' && showBanner) {
    onReady(renderBanner);
  }

  // プライバシーポリシー等の「Cookie 設定を変更する」リンク（data-consent-settings 属性）
  onReady(function () {
    var links = document.querySelectorAll('[data-consent-settings]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        e.preventDefault();
        try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
        renderBanner();
      });
    }
  });

  window.tcclConsent = {
    analyticsAllowed: function () { return !needsConsent || readChoice() === 'granted'; },
    requiresConsent: needsConsent
  };
})();
