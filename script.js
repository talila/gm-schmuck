(() => {
  const header = document.querySelector('header');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const closeMenu = (restoreFocus = false) => {
    header.classList.remove('menu-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Menü öffnen');
    if (restoreFocus) menu.focus();
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    header.classList.toggle('menu-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  });
  nav.addEventListener('click', event => { if(event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => { if(event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') closeMenu(true); });
  document.addEventListener('click', event => { if(!header.contains(event.target)) closeMenu(); });
  document.addEventListener('focusin', event => { if(!header.contains(event.target)) closeMenu(); });
  window.matchMedia('(max-width: 540px)').addEventListener('change', () => closeMenu());

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.gallery').forEach((gallery, group) => {
    const slides = [...gallery.querySelectorAll('.slide')];
    const frame = gallery.querySelector('.image-frame');
    const pause = gallery.querySelector('.pause');
    const counter = gallery.querySelector('.counter');
    let current = 0, timer, visible = false, paused = reduceMotion.matches, hovering = false;
    const fit = () => {
      const photo=slides[current], style=getComputedStyle(gallery);
      if(!photo.naturalWidth) return;
      const width=gallery.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
      const height=gallery.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
      const scale=Math.min(width/photo.naturalWidth,height/photo.naturalHeight);
      frame.style.width=`${photo.naturalWidth*scale}px`;
      frame.style.height=`${photo.naturalHeight*scale}px`;
    };
    slides.forEach((slide,i) => { slide.setAttribute('aria-hidden',String(i!==0)); slide.addEventListener('load',fit); });
    new ResizeObserver(fit).observe(gallery);
    fit();
    if(slides.length<2) return;
    gallery.setAttribute('role','region');
    gallery.setAttribute('aria-roledescription','Bildergalerie');
    gallery.setAttribute('aria-label',document.querySelector(`#title-${group+1}`).textContent);
    gallery.tabIndex=0;
    const updatePause=()=>{
      pause.textContent=paused?'▷':'Ⅱ';
      pause.setAttribute('aria-label',paused?'Automatischen Bildwechsel starten':'Automatischen Bildwechsel pausieren');
      pause.setAttribute('aria-pressed',String(paused));
    };
    const schedule=()=>{
      clearTimeout(timer);
      const focused=document.activeElement;
      const focusBlocks=gallery.contains(focused)&&focused!==pause;
      if(!paused&&visible&&!hovering&&!document.hidden&&!focusBlocks) timer=setTimeout(()=>show(current+1),7000);
    };
    const show=(index,manual=false)=>{
      current=(index+slides.length)%slides.length;
      slides[current].loading='eager';
      slides.forEach((slide,i)=>{slide.classList.toggle('active',i===current);slide.setAttribute('aria-hidden',String(i!==current));});
      counter.textContent=`${String(current+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
      fit();
      if(manual){paused=true;updatePause();}
      schedule();
    };
    gallery.querySelector('.prev').addEventListener('click',()=>show(current-1,true));
    gallery.querySelector('.next').addEventListener('click',()=>show(current+1,true));
    pause.addEventListener('click',()=>{paused=!paused;updatePause();schedule();});
    gallery.addEventListener('keydown',event=>{
      if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();show(current+(event.key==='ArrowRight'?1:-1),true);}
    });
    let touchStart;
    gallery.addEventListener('touchstart',e=>{touchStart={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};},{passive:true});
    gallery.addEventListener('touchend',e=>{
      if(!touchStart)return;
      const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;
      if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))show(current+(dx<0?1:-1),true);
      touchStart=null;
    },{passive:true});
    gallery.addEventListener('mouseenter',()=>{hovering=true;schedule();});
    gallery.addEventListener('mouseleave',()=>{hovering=false;schedule();});
    gallery.addEventListener('focusin',schedule);
    gallery.addEventListener('focusout',()=>setTimeout(schedule,0));
    document.addEventListener('visibilitychange',schedule);
    reduceMotion.addEventListener('change',()=>{paused=reduceMotion.matches;updatePause();schedule();});
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.25}).observe(gallery);
    updatePause();
  });
})();
