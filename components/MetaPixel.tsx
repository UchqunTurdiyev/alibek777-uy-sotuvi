"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// 1) _vid (external_id) cookie, 2) fbclid -> _fbc cookie, 3) UTM'larni saqlash, 4) Meta Pixel
const bootstrap = `
(function(){
  function gc(n){var m=document.cookie.match('(^|;)\\\\s*'+n+'=([^;]+)');return m?decodeURIComponent(m[2]):''}
  function sc(n,v,d){document.cookie=n+'='+encodeURIComponent(v)+';path=/;max-age='+(d*86400)+';SameSite=Lax'+(location.protocol==='https:'?';Secure':'')}
  var vid=gc('_vid');
  if(!vid){vid=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():(Date.now().toString(36)+Math.random().toString(36).slice(2));}
  sc('_vid',vid,365);
  var q=new URLSearchParams(location.search);
  var fbclid=q.get('fbclid');
  if(fbclid){var cur=gc('_fbc');if(!cur||cur.split('.').slice(3).join('.')!==fbclid){sc('_fbc','fb.1.'+Date.now()+'.'+fbclid,90);}}
  var keys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'],u={},has=false;
  keys.forEach(function(k){var v=q.get(k);if(v){u[k]=v;has=true}});
  try{if(has)localStorage.setItem('utm',JSON.stringify(u));}catch(e){}
  ${
    PIXEL_ID
      ? `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  var ud={external_id:vid};
  try{var s=JSON.parse(localStorage.getItem('ud')||'null');if(s){if(s.ph)ud.ph=s.ph;if(s.fn)ud.fn=s.fn;if(s.ln)ud.ln=s.ln;ud.country='uz';}}catch(e){}
  fbq('init','${PIXEL_ID}',ud);
  fbq('track','PageView');`
      : ""
  }
})();`;

export default function MetaPixel() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname]);

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: bootstrap }} />
      {PIXEL_ID && (
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img height="1" width="1" style={{ display: "none" }} alt=""
            src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} />
        </noscript>
      )}
    </>
  );
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}
