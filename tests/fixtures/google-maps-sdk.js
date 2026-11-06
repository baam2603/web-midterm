/* Browser contract fixture: no real Google request, no billable key. */
(() => {
 class Evented {constructor(){this.events={};}addListener(n,fn){(this.events[n]??=[]).push(fn);return {remove(){}};}fire(n,e){(this.events[n]||[]).forEach(fn=>fn(e));}}
 class Map extends Evented {constructor(el,opts){super();this.el=el;this.opts=opts;this.zoom=opts.zoom;el.dataset.googleMap='ready';window.testGoogleMaps??=[];testGoogleMaps.push(this);}setCenter(p){this.center=p;}setZoom(z){this.zoom=z;}getZoom(){return this.zoom;}fitBounds(){}}
 class AdvancedMarkerElement extends Evented {constructor(opts){super();Object.assign(this,opts);window.testGoogleMarkers??=[];testGoogleMarkers.push(this);}}
 class LatLngBounds {extend(){}}
 window.google={maps:{importLibrary:async n=>n==='maps'?{Map}:{AdvancedMarkerElement},LatLngBounds,event:{addListenerOnce(_o,_n,fn){fn();},trigger(){},clearInstanceListeners(){}}}};
 const cb=new URL(document.currentScript.src).searchParams.get('callback');window[cb]?.();
})();
