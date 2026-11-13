'use strict';
const STORE_KEY='newboomland.prototype.v1';
let state,storageAvailable=true;
try{state=JSON.parse(localStorage.getItem(STORE_KEY)||'null');}catch{storageAvailable=false;}
if(!state||state.version!==1)state=structuredClone(INITIAL);
state=publicActivityScenario(state,state.season.code,true);
if(state.season.code==='H02'&&state.participantDemoVersion===2)save();
let activeFilter='全部',searchText='',currentRoute='',toastTimer;
const $=(s,root=document)=>root.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
const money=n=>'¥'+Number(n||0).toLocaleString('zh-CN');
const fmtDate=d=>d?d.slice(5).replace('-',' / '):'待设置';
const seasonStatus=(item=state)=>item.phase==='cancelled'?'已取消':item.season.draft?'草稿':!item.season.approved?'待平台批准':PHASES[item.phase]||'进行中';
const phase=()=>seasonStatus();
const SEASON_STATUS_NOTES={'草稿':'完善赛程、规则与预算后提交平台。','待平台批准':'已提交申请，等待平台审核。','即将开始':'已获批准，等待正式开赛。','进行中':'选手正在发布作品，评委持续评分。','结算中':'处理异议、复核评分并核定奖励。','已定格':'成绩与奖励已核定，等待完成发放。','已归档':'奖励已发放，保留赛季与成果记录。','已暂停':'报名、作品提交与评分暂时停止。','已取消':'活动已取消，保留记录，不发放奖励。'};
function ensureDemoSeasons(){
 if(state.demoSeasonsVersion===1)return;
 const records={...(state.organizerSeasonRecords||{})};
 const examples=[['DEMO-D','灵感发芽季','upcoming',true,false,'2027-04-01'],['DEMO-P','社区共创季','upcoming',false,false,'2027-03-01'],['DEMO-U','城市更新季','upcoming',false,true,'2026-12-01'],['DEMO-R','产品生长季','active',false,true,'2026-11-01'],['DEMO-T','秋日实验季','settling',false,true,'2026-09-01'],['DEMO-E','夏日共创季','ended',false,true,'2026-07-01'],['DEMO-A','春日探索季','archived',false,true,'2026-03-01'],['DEMO-S','校园创新季','suspended',false,true,'2026-10-01'],['DEMO-C','冬日连接季','cancelled',false,true,'2026-12-01']];
 for(const [code,name,phase,draft,approved,start] of examples){
  if(records[code]||state.season.code===code)continue;
  const item=structuredClone(INITIAL);item.phase=phase;item.registration=phase==='active'?'open':'closed';item.season={...item.season,code,name,phase,draft,approved};item.demoSeasonsVersion=1;item.isDemoSeason=true;
  const base=new Date(start+'T12:00:00Z');item.season.dates=[0,14,16,23,22,60,67,74].map(days=>new Date(base.getTime()+days*86400000).toISOString().slice(0,10));
  if(['upcoming','cancelled'].includes(phase)){item.isEmptyDraft=true;for(const key of ['applications','works','ledger','milestones','results','disputes','announcements','logs'])item[key]=[];}
  if(draft){item.season.budget=0;item.season.pool=0;item.judges=[];}
  if(phase==='suspended')item.previousPhase='active';
  if(['ended','archived'].includes(phase))item.ledger.forEach(l=>l.reviewed=true);
  item.rewardsPaid=phase==='archived';records[code]=item;
 }
 state.organizerSeasonRecords=records;state.demoSeasonsVersion=1;save();
}

const actor='user-demo';
const isManager=()=>['organizer','admin'].includes(state.role);
const effective=()=>state.ledger.filter(l=>!l.reversed);
const used=()=>effective().reduce((s,l)=>s+l.points,0);
const judgeUsed=id=>effective().filter(l=>l.judgeId===id).reduce((s,l)=>s+l.points,0);
const judgeDailyUsed=id=>effective().filter(l=>l.judgeId===id&&l.date===new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'})).reduce((s,l)=>s+l.points,0);
const reviewerId=()=>state.role==='admin'?'admin-demo':'organizer-demo';
const allocated=()=>state.judges.reduce((s,j)=>s+j.allocated,0);
const judge=()=>state.judges.find(j=>j.id===actor);
const allProjects=()=>state.activityProjects?(state.ownProject?[...state.activityProjects,state.ownProject]:state.activityProjects):state.isEmptyDraft?(state.ownProject?[state.ownProject]:[]):state.ownProject?[...PROJECTS,state.ownProject]:PROJECTS;
const projectBy=id=>allProjects().find(p=>p.id===id)||PROJECTS[0];
const workBy=id=>state.works.find(w=>w.id===id)||state.works[0];
const canViewWork=w=>w.visibility==='public'||state.role==='admin'||state.role==='participant'&&w.authorId===actor||state.role==='judge'&&checkedScope(w);
const currentWork=()=>workBy(new URLSearchParams(location.hash.split('?')[1]||'').get('id'));
const currentChallenge=()=>publicChallenges().find(c=>c.id===new URLSearchParams(location.hash.split('?')[1]||'').get('id'));
const projectScore=p=> (p.base||0)+effective().filter(l=>state.works.some(w=>w.id===l.workId&&w.projectId===p.id)).reduce((s,l)=>s+l.points,0);
const workScore=w=>effective().filter(l=>l.workId===w.id&&l.version===w.version).reduce((s,l)=>s+l.points,0);
function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify(state));}catch{storageAvailable=false;}}
function log(action,detail){state.logs.unshift({id:uid('log'),action,detail,actor:ROLES[state.role],date:new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})});save();}
function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),4000);}
function go(route){if(location.hash==='#'+route){render();window.scrollTo(0,0);}else location.hash=route;}
function routeName(){return (location.hash.replace(/^#/,'').split('?')[0]||'seasons');}
function badge(label,color=''){return `<span class="badge ${color}">${esc(label)}</span>`;}
function button(text,action='',kind='',disabled=false){const attr=action.startsWith('#')?`href="${esc(action)}"`:`type="button" data-action="${esc(action)}"`;return action.startsWith('#')?`<a class="btn ${kind}" ${attr}>${esc(text)}</a>`:`<button class="btn ${kind}" ${attr} ${disabled?'disabled':''}>${esc(text)}</button>`;}
function notice(text,kind=''){return `<div class="notice ${kind}"><span aria-hidden="true">ⓘ</span><p>${text}</p></div>`;}
function panel(title,description,body,actions=''){return `<section class="panel"><div class="panel-head"><div><h2>${esc(title)}</h2>${description?`<p>${esc(description)}</p>`:''}</div>${actions}</div>${body}</section>`;}
function stat(label,value,foot=''){return `<div class="stat"><div class="label">${esc(label)}</div><div class="value">${value}</div><div class="foot">${esc(foot)}</div></div>`;}
function empty(title,desc='',action=''){return `<div class="empty"><strong>${esc(title)}</strong><p>${esc(desc)}</p>${action}</div>`;}
function table(headers,rows){return `<div class="table-wrap"><table><thead><tr>${headers.map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}">${empty('还没有记录','产生新的内容后会显示在这里。')}</td></tr>`}</tbody></table></div>`;}
function pageHead(title,desc='',actions=''){const publicPage=ROUTES.find(r=>r[0]===currentRoute)?.[2]==='public';return `<div class="page-head"><div>${publicPage?'<div class="eyebrow">BOOMLAND / GROW TOGETHER</div>':''}<h1>${esc(title)}</h1>${desc?`<p>${esc(desc)}</p>`:''}</div><div class="page-actions">${actions}</div></div>`;}
function sectionHead(title,action='',index=''){return `<div class="section-heading"><h2>${index?`<span class="index">${index}</span>`:''}${esc(title)}</h2>${action}</div>`;}
function tabs(labels,selected,action='filter'){return `<div class="tabs">${labels.map(x=>`<button data-action="${action}" data-value="${esc(x)}" class="${x===selected?'active':''}">${esc(x)}</button>`).join('')}</div>`;}
function field(label,name,type='text',value='',full=false,extra='',hint=''){return `<div class="field ${full?'full':''}"><label for="${esc(name)}" class="required">${esc(label)}</label><input id="${esc(name)}" name="${esc(name)}" type="${type}" value="${esc(value)}" required ${extra}>${hint?`<span class="help">${esc(hint)}</span>`:''}</div>`;}
function textarea(label,name,value='',help=''){return `<div class="field full"><label for="${esc(name)}" class="required">${esc(label)}</label><textarea name="${esc(name)}" id="${esc(name)}" required>${esc(value)}</textarea>${help?`<span class="help">${esc(help)}</span>`:''}</div>`;}
function selectField(label,name,options,value='',full=false){return `<div class="field ${full?'full':''}"><label for="${name}">${esc(label)}</label><select name="${name}" id="${name}">${options.map(o=>{const[v,t]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}" ${v===value?'selected':''}>${esc(t)}</option>`;}).join('')}</select></div>`;}
function form(id,body,submit='保存',disabled=false){return `<form data-form="${id}">${body}<div class="form-error" role="alert"></div><div class="form-footer">${button('返回','back')}<button class="btn primary" type="submit" ${disabled?'disabled':''}>${esc(submit)}</button></div></form>`;}
function check(label,name='terms',required=true){return `<label class="check"><input name="${name}" type="checkbox" ${required?'required':''}><span>${label}</span></label>`;}
function formError(form,message){const el=$('.form-error',form);el.textContent=message;el.classList.add('visible');el.scrollIntoView({block:'nearest',behavior:'smooth'});}
function phaseNotice(){if(state.phase==='cancelled')return notice('赛季已取消。积分保留为档案，不折算、不发放奖励。','pink');if(state.phase==='suspended')return notice('赛季已暂停：主办方正在调整赛程。报名、作品发布和评分暂时停止。');if(['ended','archived'].includes(state.phase))return notice('本季成绩已定格。你仍然可以浏览作品、评分记录与奖励进度。','green');if(state.phase==='settling')return notice('赛季结算中，已停止新增作品与评分，正在处理复核和奖励核定。');return '';}
function canWrite(kind){if(state.phase==='suspended')return '赛季暂停期间不能操作。';if(state.phase==='cancelled')return '赛季已取消，不能继续操作。';if(kind==='apply'){if(!['upcoming','active','workClosed'].includes(state.phase))return '当前阶段不能报名。';if(new URLSearchParams(location.hash.split('?')[1]||'').get('code')==='H02')return '报名已截止。';if(upcomingEventFromRoute())return '报名未开放。';if(state.registration!=='open')return '报名窗口尚未开放或已经截止。';if(state.role==='visitor')return '请先登录后报名。';return '';}
 if(kind==='score'){if(!['active','workClosed'].includes(state.phase))return '当前阶段不能新增评分，只有进行中且未过评分截止可以评分。';if(state.role!=='judge')return '需要切换到具有有效授权的评委身份。';if(!judge()?.active)return '当前评分授权已停用。';return '';}
 if(state.phase!=='active')return kind==='work'&&state.phase==='workClosed'?'作品截止后不能发布新作品或新版本，但仍可查看评分。':'当前阶段不能提交这类内容。';
 if(['project','work','milestone','result'].includes(kind)&&state.role!=='participant')return '只有参赛者可以操作本人项目。';if(kind==='project'&&state.application?.status!=='已通过')return '报名通过后才可以创建或带入项目。';if(kind!=='project'&&['work','milestone','result'].includes(kind)&&!state.ownProject)return '请先创建或带入本人项目。';return '';}
function layout(content,workspaceRole=''){
 const title=ROUTES.find(r=>r[0]===currentRoute)?.[1]||'火热赛季';document.title=title+' — BoomLand';
 if(workspaceRole){
  const globalRoutes=['organizer-seasons','season-create','organizer-drafts'];
  const nav=ROUTES.filter(r=>r[2]===workspaceRole&&!r[3]&&(workspaceRole!=='participant'||['workspace','my-projects','rewards'].includes(r[0])));
  const routeAncestors=(()=>{const out=[];let p=ROUTES.find(x=>x[0]===currentRoute)?.[3];while(p&&!out.includes(p)){out.push(p);p=ROUTES.find(x=>x[0]===p)?.[3];}return out;})();
  const navLink=(r,icon)=>`<a href="#${r[0]}" class="${(r[0]===currentRoute||routeAncestors.includes(r[0])||r[0]==='admin-challenges'&&['challenge-manage','challenge-edit'].includes(currentRoute))?'active':''}" ${r[0]===currentRoute?'aria-current="page"':''}><span aria-hidden="true">${icon}</span>${esc(r[1])}</a>`;
  const organizerNav=workspaceRole==='organizer'?`${globalRoutes.map((id,i)=>navLink(ROUTES.find(r=>r[0]===id),['▦','＋','▤'][i])).join('')}<hr class="sidebar-divider"><label class="sidebar-season-label" for="organizer-season">赛季选择</label>${organizerSeasonSelect()}`:'';
  return `<div class="workspace"><aside class="sidebar" aria-label="${ROLES[workspaceRole]}导航"><div class="sidebar-title">${ROLES[workspaceRole]}工作台</div>${organizerNav}${nav.filter(r=>!globalRoutes.includes(r[0])).map((r,i)=>(workspaceRole==='enterprise'&&r[0]==='resources'?'<hr class="sidebar-divider">':'')+navLink(r,{'my-projects':'▣'}[r[0]]||['◈','＋','▤','◇','⊞','◎','▣','◷','✳'][i%9])).join('')}<a class="back" href="#season">← 返回赛季</a></aside><main id="main" class="work-main" tabindex="-1">${workspaceRole==='enterprise'||workspaceRole==='organizer'&&globalRoutes.includes(currentRoute)?'':phaseNotice()}${content}</main></div>`;
 }
 return `<main id="main" tabindex="-1">${content}</main>`;
}
/* 头像下拉菜单（PRD 6.0「我的」菜单的最小版）：工作台入口 + 我的关注（关注的赛季）。 */
function followedActivities(){const seen=new Set(),items=[];const push=(code,record)=>{if(!record||seen.has(code))return;seen.add(code);if(record.followed)items.push({code,record});};push(state.season.code,state);for(const [code,record] of Object.entries(state.organizerSeasonRecords||{}))push(code,record);return items;}
function avatarMenu(workHome){const homeLabel={participant:'我的工作台',judge:'评委台',organizer:'主办方后台',enterprise:'本企业命题',admin:'平台后台'}[state.role]||'我的工作台';const followed=followedActivities();return `<div class="avatar-menu-wrap"><button type="button" class="icon-btn avatar" data-action="avatar-menu" aria-haspopup="true" aria-expanded="false" aria-label="我的菜单">${esc((state.role==='participant'&&state.personaName||'叶青')[0])}</button><div class="avatar-menu" hidden><a class="avatar-menu-item" href="#${workHome}">${esc(homeLabel)}</a><div class="avatar-menu-label">我的关注</div>${followed.length?followed.map(({code,record})=>`<a class="avatar-menu-item" href="#season?code=${esc(code)}"><span>${esc(record.season.name.replace(/^BoomLand\s*/,''))}</span><small>${esc(activityDisplayStatus(record))}</small></a>`).join(''):`<div class="avatar-menu-empty">暂无关注</div>`}</div></div>`;}
function renderHeader(){const workHome={participant:'workspace',organizer:'organizer',judge:'judge',enterprise:'enterprise',admin:'admin'}[state.role]||'apply';const announcementRecord=state.role==='visitor'&&['season','seasons'].includes(currentRoute)?guestHeaderAnnouncementRecord():state;const n=(state.role==='visitor'?guestPublicAnnouncements(announcementRecord):state.announcements).filter(n=>!n.read).length;$('#header').innerHTML=`<div class="header-inner"><a class="brand" href="#seasons" aria-label="BoomLand 首页"><img src="assets/logo.svg" alt="BoomLand"></a><nav class="main-nav" aria-label="主导航">${[['home','大厅'],['seasons','火热赛季'],['projects','产品共生'],['talent','共鸣之地'],['rankings','排行榜']].map(([id,t])=>`<a ${id==='seasons'?'href="#seasons"':'aria-disabled="true" tabindex="-1" style="cursor:default"'} class="${id==='seasons'&&['seasons','challenge','archive'].includes(currentRoute)?'active':''}">${t}</a>`).join('')}</nav><div class="header-actions"><button class="icon-btn" data-action="search" aria-label="搜索"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="16.3" y1="16.3" x2="21" y2="21"/></svg></button><button class="icon-btn" data-action="notifications" aria-label="公告${n?'，有未读消息':''}"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>${n?'<i class="dot"></i>':''}</button>${state.role==='participant'?button('我的赛季','#workspace','header-my-season'):''}${state.role==='visitor'?button('登录','guest-sign-in','header-login'):avatarMenu(workHome)}<select class="role-switch" id="header-role" aria-label="切换身份">${Object.entries(ROLES).flatMap(([value,label])=>value==='participant'?[[value,label],['participant-multi','参赛者（多活动）']]:[[value,label]]).map(([value,label])=>`<option value="${value}" ${(state.role==='participant'&&state.participantPersona==='multi'?'participant-multi':state.role)===value?'selected':''}>${esc(label)}</option>`).join('')}</select></div></div>`;$('#footer').innerHTML=`<span>BoomLand / 让真实行动留下记录</span><div class="legal"><button class="link small" data-action="about-prototype">原型说明</button><button class="link small" data-action="route-map">页面总览</button><a href="#seasons">返回赛季</a></div>`;}
function render(){currentRoute=routeName();const entry=ROUTES.find(r=>r[0]===currentRoute);const publicParticipant=['apply','project','work','milestone'];const allowed=!entry||entry[2]==='public'||entry[2]===state.role||state.role==='admin'&&['challenge-manage','challenge-edit'].includes(currentRoute)||publicParticipant.includes(currentRoute);let content;if(!allowed){content=layout(`<div class="container">${empty('这个页面需要对应身份','可在右上角下拉框切换身份，查看该角色的界面。',button('切换预览身份','preview','primary'))}</div>`);}else if(PAGES[currentRoute]){content=PAGES[currentRoute]();}else{content=layout(`<div class="container">${empty('没有找到这个页面','请从赛季首页重新进入。',button('返回赛季','#seasons','primary'))}</div>`);}$('#app').innerHTML=content;fitEventTickets();renderHeader();if(!storageAvailable)toast('当前浏览器不支持本地保存，本次修改会保留在当前会话。');}
function openModal(title,body,footer=''){const d=$('#modal');d.innerHTML=`<div class="modal-head"><h2 id="modal-title">${esc(title)}</h2><button type="button" data-action="close-modal" aria-label="关闭">×</button></div>${body}${footer?`<div class="modal-footer">${footer}</div>`:''}`;if(!d.open)d.showModal();}
function closeModal(){$('#modal').close();}
function preview(){if(routeName()==='season'){const code=new URLSearchParams(location.hash.split('?')[1]||'').get('code');const record=code?publicActivityRecord(code):null;if(record&&(isManager()||record.season.approved&&!record.season.draft))enterPublicActivity(code);}openModal('预览设置',`${button('参赛者演示场景','participant-demo-picker','sm')}<p class="small muted">查看报名、组队、作品评分与结算的完整演示。</p><div class="preview-note">这是使用模拟数据的交互原型。右上角可切换预览身份。此处的阶段等设置只影响本机原型，不代表真实登录或服务端权限。</div><form data-form="preview"><div class="form-grid" style="margin-top:22px">${selectField('赛季阶段','phase',Object.entries(PHASES).flatMap(([v,l])=>v==='active'?[[v,l],['workClosed','进行中 · 作品已截止']]:[[v,l]]),state.phase)}${selectField('报名窗口','registration',[['notOpen','报名未开放'],['open','报名中'],['closed','报名已截止']],state.registration)}${selectField('列表展示状态','listState',[['normal','正常'],['loading','加载中'],['empty','没有数据'],['error','加载失败']],state.listState||'normal')}</div><div class="form-footer"><button type="button" class="btn danger" data-action="reset">重置演示数据</button><button class="btn primary" type="submit">应用设置</button></div></form>`);}
function confirmation(title,body,action,danger=false){openModal(title,`<p>${esc(body)}</p>`,button('取消','close-modal')+button('确认',action,danger?'danger':'primary'));}
function guardManager(){if(!isManager()){toast('需要主办方或平台管理员权限。');return false;}return true;}
function announce(title,body,target=/赛程|规则|暂停|恢复|取消|定格|正式开始/.test(title)?'全体用户':'本赛季选手'){state.announcements.unshift({id:uid('n'),title,body,target,date:'演示更新',read:false});}
function checkedScope(w){const j=judge();if(!j)return false;return j.scope==='all'||projectBy(w.projectId).challenges.includes(j.scope)&&(!w.tag||w.tag===j.scope);}
function listState(normal){if(state.listState==='loading')return `<div aria-busy="true" aria-label="正在加载"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><p class="muted">正在读取内容…</p>${button('恢复正常展示','list-normal','sm')}</div>`;if(state.listState==='empty')return empty('这里暂时还没有内容','发布作品或完成操作后，记录会出现在这里。',button('恢复正常展示','list-normal','sm'));if(state.listState==='error')return empty('内容加载失败','请重试，当前已填写的表单内容不会清空。',button('重新加载','list-normal','primary'));return normal;}
document.addEventListener('DOMContentLoaded',()=>{ensureDemoSeasons();window.addEventListener('hashchange',()=>{activeFilter='全部';searchText='';render();window.scrollTo(0,0);});$('#preview-trigger').addEventListener('click',preview);$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal();});document.addEventListener('change',event=>{const libraryFilter=event.target.closest?.('form[data-form="guest-library-filter"]');if(libraryFilter&&event.target.tagName==='SELECT'){libraryFilter.requestSubmit();return;}if(event.target.id==='organizer-season'){switchOrganizerSeason(event.target.value);return;}if(event.target.id!=='header-role')return;const next=event.target.value;if(next==='participant-multi'){if(state.role==='participant'&&state.participantPersona==='multi')return;loadMultiParticipantPersona();return;}if(next==='participant'&&state.role==='participant'&&state.participantPersona==='multi'){resetToSingleParticipant();return;}if(!Object.hasOwn(ROLES,next)||next===state.role)return;state.role=next;save();go(roleHomes[next]);render();toast('已切换为'+ROLES[next]);});document.addEventListener('click',handleClick);document.addEventListener('submit',handleSubmit);render();});

let eventTicketObserver;
function fitEventTickets(){if(typeof ResizeObserver==='undefined')return;if(eventTicketObserver)eventTicketObserver.disconnect();eventTicketObserver=new ResizeObserver(entries=>{for(const entry of entries){const canvas=entry.target.querySelector('.event-ticket-canvas');if(canvas)canvas.style.transform='scale('+(entry.contentRect.width/432)+')';}});document.querySelectorAll('.event-ticket').forEach(card=>{card.querySelector('.event-ticket-canvas').style.transform='scale('+(card.getBoundingClientRect().width/432)+')';eventTicketObserver.observe(card);});}

function organizerChallenges(){
 const base=state.managedChallenges||(state.isEmptyDraft?[]:CHALLENGES.map(c=>({...c,status:'已发布',version:1})));
 const ids=new Set(base.map(c=>c.id));
 return [...base,...(state.draftChallenges||[]).filter(c=>!ids.has(c.id))].map(c=>({...c,resource:c.resource??c.resources??'',target:c.target??c.evidence??'',evidence:c.evidence??'',rights:c.rights??'',reward:c.reward??'',verifier:c.verifier??'',status:c.status||(c.published?'已发布':'草稿'),version:c.version||1,capacity:c.capacity??6,taken:c.taken??0,symbol:c.symbol||'✳',versions:c.versions||[]}));
}
function publicChallenges(){return organizerChallenges().filter(c=>c.status!=='草稿');}
function selectableChallenges(){return organizerChallenges().filter(c=>c.status==='已发布');}
function challengeFrozen(){return state.phase!=='upcoming';}
function managedChallenge(){const id=new URLSearchParams(location.hash.split('?')[1]||'').get('id');return organizerChallenges().find(c=>c.id===id);}
function storeManagedChallenge(item){const items=organizerChallenges();const i=items.findIndex(c=>c.id===item.id);if(i<0)items.push(item);else items[i]=item;state.managedChallenges=items;}

const ENTERPRISE_COMPANY='Orion AI';
function enterpriseChallenges(){return organizerChallenges().filter(c=>c.company===ENTERPRISE_COMPANY);}
function enterpriseChallenge(){const id=new URLSearchParams(location.hash.split('?')[1]||'').get('id');return id?enterpriseChallenges().find(c=>c.id===id):enterpriseChallenges().find(c=>c.status!=='草稿')||enterpriseChallenges()[0];}
function projectsForChallenge(id){return allProjects().filter(p=>p.challenges.includes(id));}
function publicChallengeWorks(id){const projects=projectsForChallenge(id);return state.works.filter(w=>w.visibility==='public'&&projects.some(p=>p.id===w.projectId)&&w.tag===id);}
function canReadChallenge(c){return c&&(state.season.approved||isManager()||state.role==='enterprise'&&c.company===ENTERPRISE_COMPANY);}

function enterpriseSubmissionStatus(c){return c.status==='草稿'?'待发布':c.status;}
function enterpriseUnsubmittedDrafts(){return (state.enterpriseChallengeDrafts||[]).filter(c=>c.company===ENTERPRISE_COMPANY);}

function challengePublishedActivity(c){
 if(!['已发布','已关闭','已归档'].includes(c.status))return null;
 return c.publishedActivity||{code:state.season.code,name:state.season.name,type:state.season.type||'season'};
}

function upcomingEventFromRoute(){const code=new URLSearchParams(location.hash.split('?')[1]||'').get('code');return Object.hasOwn(UPCOMING_EVENTS,code)?UPCOMING_EVENTS[code]:null;}

function publicActivityRecord(code,adopt){
 if(code===state.season.code&&code!=='S02')return publicActivityScenario(state,code,adopt);
 if(state.organizerSeasonRecords?.[code]&&code!=='S02')return publicActivityScenario(state.organizerSeasonRecords[code],code,adopt);
 const record=structuredClone(INITIAL);record.role=state.role;
 if(code==='S01')return publicActivityScenario(record,code,adopt);
 if(code==='S02'){const event=UPCOMING_EVENTS.S02;record.phase='upcoming';record.registration='notOpen';record.season={...record.season,code,name:'BoomLand '+event.name,theme:event.description,type:'season',dates:event.dates};record.isEmptyDraft=true;record.managedChallenges=[];record.activityProjects=[];for(const key of ['applications','works','ledger','judges','announcements','milestones','results'])record[key]=[];return mockPublicNotices(record);}
 if(code==='W01'){
  record.phase='upcoming';record.registration='open';record.season={...record.season,code,name:'BoomLand 共创工作坊',theme:'两天做出一个能给人用的东西',type:'season',formatLabel:'共创工作坊',participantCapacity:24,dates:['2026-10-27','2026-11-11','2026-11-14','2026-11-14','2026-11-14','2026-11-15','2026-11-16','2026-11-18']};record.isEmptyDraft=true;record.managedChallenges=[];record.activityProjects=[];record.application=null;record.ownProject=null;for(const key of ['works','ledger','judges','announcements','milestones','results','draftChallenges','enterpriseChallengeDrafts','applications','logs'])record[key]=[];return mockWorkshopActivity(record);
 }
 if(['A01','P00'].includes(code)){const archive=code==='P00';record.phase=archive?'archived':'ended';record.registration='closed';record.season={...record.season,code,name:archive?'预热季':'产品共学季 · 秋季',theme:archive?'平台上线前的第一次公开征集':'每周一个产品命题，一起把话讲清楚',formatLabel:archive?'预热季':'产品共学季',dates:archive?['2026-07-20','2026-08-01','2026-08-02','2026-08-03','2026-08-02','2026-08-16','2026-08-17','2026-08-20']:['2026-10-01','2026-10-10','2026-10-11','2026-10-12','2026-10-11','2026-10-25','2026-10-26','2026-10-31']};record.activityProjects=[];record.managedChallenges=[];record.application=null;record.ownProject=null;record.rewardsPaid=archive;record.publicSummary={projects:archive?13:32,detailsPublished:false};record.season.budget=null;record.season.pool=null;for(const key of ['works','ledger','judges','announcements','milestones','results','draftChallenges','enterpriseChallengeDrafts','applications','logs'])record[key]=[];return mockArchivedActivity(record);}
 if(code!=='H02')return null;
 return freshHackathonRecord(state.role);
}



function freshHackathonRecord(role='visitor'){const record=structuredClone(INITIAL),code='H02';record.role=role;
 const event=HACKATHON_EVENT;record.phase='active';record.registration='closed';record.season={...record.season,code,name:'BoomLand '+event.name,theme:event.description,type:'hackathon',dates:event.dates,budget:5000,pool:5000};
 record.managedChallenges=[{...structuredClone(CHALLENGES[0]),id:'hc1',name:'让社区的闲置资源流动起来',description:'为社区居民设计一个可试用的闲置资源共享方案。',audience:'社区居民与社区服务运营者',resource:'社区访谈、产品导师与试点场地',target:'完成可演示原型，收集首轮使用反馈。',status:'已发布',taken:2,capacity:8,version:1}];
 record.activityProjects=[{id:'hp1',name:'邻里共享站',tagline:'把闲置物品带给需要的邻居',icon:'↗',challenges:['hc1'],members:['周宁','林可'],stage:'生长',r:'R2',base:0},{id:'hp2',name:'社区工具箱',tagline:'让工具在社区里接力使用',icon:'✳',challenges:['hc1'],members:['程远'],stage:'发芽',r:'R1',base:0}];
 record.works=[{id:'hw1',projectId:'hp1',title:'共享站第一版原型与社区访谈',type:'原型',body:'完成物品登记与借用流程原型，正在根据社区访谈调整使用路径。',summary:'原型演示和第一轮访谈反馈',author:'周宁',authorId:'member-hp1',version:1,tag:'hc1',visibility:'public',date:'2026-11-10',evidence:[]}];record.ledger=[{id:'hl1',workId:'hw1',version:1,judgeId:'judge-lin',judge:'林舟',points:120,reason:'完成原型与首轮用户验证。',reviewed:true,reversed:false,date:'2026-11-10'}];
 record.applications=[...new Set(record.activityProjects.flatMap(p=>p.members))].map((name,i)=>({id:'ha'+i,name,status:'已通过',group:'已加入'}));record.announcements=[{id:'hn1',title:'城市黑客松已开赛',body:'请在作品截止前提交原型与验证记录。',target:'全体用户',date:'2026-11-09',read:false}];record.milestones=[];record.results=[];record.draftChallenges=[];record.enterpriseChallengeDrafts=[];record.ownProject=null;record.application=null;record.logs=[];return mockPublicNotices(record);
}

function mockPublicNotices(record){
 const names={S01:'BoomLand 生长季',W01:'BoomLand 共创工作坊',H02:'BoomLand 城市黑客松',A01:'产品共学季 · 秋季',P00:'预热季'};
 if(record.season.name!==names[record.season.code])return record;
 const copy={...record,announcements:record.announcements.slice()},code=record.season.code,dates=record.season.dates;
 const date=['ended','archived'].includes(record.phase)?dates[7]:record.phase==='upcoming'?(code==='S01'?'2026-11-10':dates[0]):dates[2];
 const notices=[['schedule','本季赛程与提交时间','活动时间为 '+dates[2]+' 至 '+dates[6]+'。作品截止 '+dates[5]+'，评分截止 '+dates[6]+'，所有时间均为北京时间。'],['rules','作品评分与奖励规则','作品采用多位评委滚动评分，积分归项目。结算前展示预计奖励，核定金额与发放进度以赛后记录为准。'],['public','公开作品与材料使用约定','公开展示原型、验证方法与项目进展。客户联系方式、合同及收入证明仅供核验，不会随作品公开展示。']];
 for(const [key,title,body] of notices){const id=code+'-notice-'+key;if(!copy.announcements.some(n=>n.id===id))copy.announcements.push({id,title,body,target:'全体用户',status:'published',date,read:false});}
 return copy;
}

function mockWorkshopActivity(source){
 const record=structuredClone(source);record.mockDataVersion=1;
 record.managedChallenges=CHALLENGES.map((challenge,i)=>({...structuredClone(challenge),id:'wc'+i,name:['为社区服务设计一个可试用的预约工具','让创作者和品牌快速找到合作切入点','把共学资料变成可检索的知识卡片'][i],description:['为社区活动与共享服务提供简洁的预约流程，验证居民和服务者的实际使用体验。','整理创作者与品牌双方的需求，用可执行的小额试点验证合作流程。','将共学资料整理为带来源的知识卡片，支持检索并收集学习者反馈。'][i],audience:['社区活动组织者与居民','独立创作者与品牌','共学资料的整理者与学习者'][i],resource:'用户访谈机会、原型工具与导师辅导',target:'完成可演示原型，并记录至少一轮真实用户试用反馈。',capacity:8,taken:0,status:'已发布',version:1,exclusive:false}));
 record.judges=record.judges.length?record.judges:structuredClone(INITIAL.judges);
 record.judges.forEach(judge=>{judge.scope='all';judge.conflictDisclosure='与参赛项目无利益关系';});
 record.applications=Array.from({length:8},(_,i)=>({id:'wa'+i,name:'工作坊选手'+(i+1),status:'已通过',group:'已加入'}));
 record.announcements=[{id:'wn1',title:'共创工作坊开放报名',body:'命题与评委名单已公布。开赛后围绕真实问题组队共创，提交可运行原型与用户反馈。',target:'全体用户',status:'published',date:record.season.dates[0],read:false}];
 return mockPublicNotices(record);
}

// Complete, deterministic fixtures for the two historical demo activities.
function mockArchivedActivity(source){
 const record=structuredClone(source),code=record.season.code,archived=code==='P00',count=archived?13:32;
 const projectNames=['用户回声','邻里书架','共学日历','创作者名片','社区修理站','轻量排期','远程午餐','无障碍地图','灵感收件箱','小店记账本','城市散步','开放实验室','任务拼图','学习搭子','绿色通勤','街角展览','共享工具箱','品牌接力','访谈速记','产品观察站','社群导航','合作小票','周末共创','成长手册','资源雷达','体验笔记','微光档案','创意交换所','伙伴地图','作品橱窗','行动清单','需求便利店'];
 const companyNames=['Proto Seeds','SheNicest','Field Notes'];
 record.mockDataVersion=1;record.publicSummary={projects:count,detailsPublished:true};
 Object.assign(record.season,{budget:archived?8000:20000,pool:archived?8000:20000,ratio:1,frozenAt:record.season.dates[7],unallocatedDisposition:'未分配积分收回，不折算奖励；未使用奖励预算退回主办方。'});
 record.judges=companyNames.map((company,i)=>({id:code+'-judge-'+i,name:['温禾','唐可','叶青'][i],company,scope:'all',allocated:archived?[2400,2400,2400][i]:6000,active:true,conflictDisclosure:'与参赛项目无利益关系'}));
 record.managedChallenges=companyNames.map((company,i)=>({id:code+'-challenge-'+i,symbol:['P','S','F'][i],company,name:['让产品反馈变成可执行的改进','让一次共创形成可持续的合作','把公开信息变成可复用的工具'][i],description:['围绕真实用户反馈，设计并验证一项产品改进。','为社区、品牌与创作者建立能够复用的合作流程。','整理可追溯的公开信息，帮助用户完成一次真实决策。'][i],type:['解决方案 / POC','上下游合作','数据 / 研究'][i],audience:['正在改进产品的早期团队','社区、品牌与创作者','需要产业判断的新进入团队'][i],resource:'用户访谈、导师辅导与公开展示机会',target:'提交可运行原型、用户验证记录和迭代总结。',capacity:Math.ceil(count/3)+2,taken:Math.floor(count/3)+(i<count%3?1:0),exclusive:false,status:'已归档',version:2}));
 record.activityProjects=Array.from({length:count},(_,i)=>{const challenge=record.managedChallenges[i%3];return {id:code+'-project-'+i,name:(archived?'预热 · ':'')+projectNames[i],tagline:'从真实需求出发，完成原型、试用与持续改进。',description:'围绕'+challenge.name+'开展访谈与原型验证，已整理公开试用反馈和项目复盘。',icon:['↗','✳','▦'][i%3],challenges:[challenge.id],members:['共创者'+(i*2+1),'共创者'+(i*2+2)],stage:'开花',r:['R5','R4','R3','R2','R6'][i%5],rVerified:i%5!==3,base:0,publicInteractionCount:18+i*7,publicPartners:[challenge.company],publicCooperationStatus:i%3===0?'持续试点':i%3===1?'后续合作洽谈中':'已完成本季合作'};});
 record.works=record.activityProjects.flatMap((project,i)=>[0,1].map(n=>({id:code+'-work-'+i+'-'+n,projectId:project.id,title:project.name+(n?'：试用反馈与迭代总结':'：原型与用户访谈'),type:n?'客户反馈':'原型',body:n?'完成首轮公开试用，根据反馈优化关键流程，并记录本季验证结论和后续合作计划。':'完成用户访谈与可运行原型，展示核心使用流程、问题假设与验证方法。',summary:n?'真实试用反馈、迭代结果与后续计划':'首版原型与用户访谈结论',author:project.members[0],authorId:'member-'+project.id,version:n?2:1,validVersionCount:n?2:1,tag:project.challenges[0],visibility:'public',date:record.season.dates[n?5:2],evidence:[]})));
 record.ledger=record.works.map((work,i)=>{const judge=record.judges[i%3];return {id:code+'-score-'+i,workId:work.id,version:work.version,judgeId:judge.id,judge:judge.name,points:80+(i%7)*15,reason:'原型可运行，用户验证记录完整，迭代结论有明确证据。',reviewed:true,reversed:false,date:record.season.dates[6]};});
 record.applications=record.activityProjects.flatMap(project=>project.members.map((name,i)=>({id:project.id+'-member-'+i,name,status:'已通过',group:'已加入'})));
 record.results=record.activityProjects.filter(project=>project.rVerified).map(project=>({id:project.id+'-result',projectId:project.id,visibility:'public',status:'已核验',level:project.r,title:project.name+'已完成用户验证与公开成果交付',date:record.season.dates[5]}));
 record.rewardRecords=record.activityProjects.map((project,i)=>({id:project.id+'-reward',projectId:project.id,amount:record.ledger.filter(score=>record.works.some(work=>work.id===score.workId&&work.projectId===project.id)).reduce((sum,score)=>sum+score.points,0),status:archived||i<24?'paid':'paying'}));
 record.rewardsPaid=record.rewardRecords.every(reward=>reward.status==='paid');
 record.announcements=[{id:code+'-final',title:'赛季积分已定格，赛后成果开放浏览',body:archived?'本季奖励已全部发放，项目、作品和公开成果持续保留。':'本季积分与奖励金额已完成核定，奖励正在按项目分批发放。',target:'全体用户',status:'published',date:record.season.dates[7],read:false}];
 record.logs=[{id:code+'-freeze',action:'赛季定格',detail:'本季积分及奖励金额完成核定。',date:record.season.dates[7]}];
 record.season.ruleVersions=[{version:2,date:record.season.dates[2],changes:[{label:'单次评分上限',before:'150 积分',after:record.season.cap+' 积分'}]}];
 return mockPublicNotices(record);
}

function withPublicActivity(code,view){const record=publicActivityRecord(code);if(!record)return view();const previous=state;state={...record,role:previous.role};try{return view();}finally{state=previous;}}
function publicActivityInfo(code){const record=publicActivityRecord(code);const metrics=withPublicActivity(code,guestEventMetrics);const capacity=record.season.participantCapacity;return {code,name:record.season.name.replace(/^BoomLand\s*/,''),description:record.season.theme,status:activityDisplayStatus(record),group:record.registration==='open'&&record.phase==='upcoming'?'报名中':['upcoming'].includes(record.phase)?'即将开始':['active','workClosed','suspended'].includes(record.phase)?'进行中':'已结束',date:[record.season.dates[2],record.season.dates[6]].join(' — '),dates:record.season.dates,url:'#season?code='+code,count:record.phase==='upcoming'&&record.registration==='notOpen'?'报名尚未开放':'已通过 '+metrics.approved+' / '+(capacity||'不限')+' · '+metrics.projects+' 个项目 · '+metrics.works+' 件作品',record,metrics};}

function enterPublicActivity(code){const record=publicActivityRecord(code,true);if(!record)throw new Error('活动不存在。');const records={...(state.organizerSeasonRecords||{})};records[state.season.code]=organizerSnapshot();const role=state.role;state={...structuredClone(record),role,organizerSeasonRecords:records,pinnedSeasonCode:state.pinnedSeasonCode||record.pinnedSeasonCode};save();}

function publicActivityScenario(record,code,adopt){
 if(code==='H02'&&record.participantDemo&&record.participantDemoVersion!==2)record=repairHackathonParticipantDemo(record);
 if(code==='W01'&&record.isEmptyDraft&&!record.mockDataVersion&&!record.activityProjects?.length&&!record.applications.length)return mockWorkshopActivity(record);
 if(['A01','P00'].includes(code)&&record.publicSummary?.detailsPublished===false)return mockArchivedActivity(record);
 if(record.season.type==='workshop')record={...record,season:{...record.season,type:'season',formatLabel:record.season.formatLabel||'共创工作坊'}};
 if(code!=='S01'||record.season.name!==INITIAL.season.name||!record.season.approved||record.season.draft)return mockPublicNotices(record);
 // 公开展示的生长季始终固定为「即将开始」，只有主办方真正点过「开赛」（seasonStarted）才跟随实际阶段。
 // adopt=true 表示要把记录采纳为当前状态（启动自愈、enterPublicActivity），此时保留参赛者演示场景，避免演示数据被清空。
 if(record.seasonStarted||(adopt&&record.participantDemo))return mockPublicNotices(record);
 if(record.phase!=='upcoming'||record.registration!=='notOpen'||record.detailStateVersion!==2){
  record=structuredClone(record);record.phase='upcoming';record.registration='notOpen';record.detailStateVersion=2;record.isEmptyDraft=true;record.activityProjects=[];record.application=null;record.ownProject=null;record.rewardsPaid=false;
  record.managedChallenges=(record.managedChallenges||CHALLENGES.map(c=>({...c,status:'已发布',version:1}))).map(c=>({...c,taken:0}));
  for(const key of ['applications','works','ledger','milestones','results','logs','rewardRecords'])record[key]=[];
  record.announcements=[{id:'s01-preview',title:'生长季即将开启',body:'本季命题、规则和赛程已公布，报名将于 2026 年 11 月 15 日开放。',target:'全体用户',status:'published',date:'2026-11-10',read:false}];
 }
 return mockPublicNotices(record);
}
function activityDisplayStatus(record=state){
 if(record.phase==='upcoming'&&!record.season.draft&&record.season.approved)return {notOpen:'即将开始',open:'报名中',closed:'即将开始'}[record.registration]||'即将开始';
 return seasonStatus(record);
}
function activityRegistrationStatus(record=state){
 if(record.phase==='cancelled')return '活动已取消';
 if(['active','workClosed','settling','ended','archived'].includes(record.phase))return '报名已截止';
 return {notOpen:'报名未开放',open:'报名中',closed:'报名已截止'}[record.registration]||'报名未开放';
}

function seasonRuleSnapshot(){const s=state.season;return {challengeLimit:s.challengeLimit||3,projectLimit:s.projectLimit||1,teamLimit:s.teamLimit||3,cap:s.cap,ratio:s.ratio,threshold:s.threshold,budget:s.budget,pool:s.pool,dates:s.dates.join(' / '),optionalRules:(s.optionalRules||[]).join('；')};}
function recordSeasonRuleChange(before){const after=seasonRuleSnapshot();const labels={challengeLimit:'项目命题上限',projectLimit:'每人项目数',teamLimit:'核心团队人数',cap:'单次评分上限',ratio:'兑换比例',threshold:'大额复核阈值',budget:'奖励预算',pool:'积分池总量',dates:'赛程',optionalRules:'补充规则'};const changes=Object.keys(labels).filter(key=>String(before[key])!==String(after[key])).map(key=>({label:labels[key],before:String(before[key]??'—'),after:String(after[key]??'—')}));if(!changes.length)return;const history=state.season.ruleVersions||[];state.season.ruleVersions=[...history,{version:(history.at(-1)?.version||1)+1,date:new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}),changes}];}

function guestRegistrationForRecord(record){const previous=state;state=record;try{return guestRegistrationLabel();}finally{state=previous;}}

let guestHeroTouch;
document.addEventListener('touchstart',event=>{if(event.target.closest?.('.hero')&&event.touches.length===1)guestHeroTouch={x:event.touches[0].clientX,y:event.touches[0].clientY};},{passive:true});
document.addEventListener('touchend',event=>{if(!guestHeroTouch||!event.changedTouches.length)return;const dx=event.changedTouches[0].clientX-guestHeroTouch.x,dy=event.changedTouches[0].clientY-guestHeroTouch.y;guestHeroTouch=null;if(Math.abs(dx)<50||Math.abs(dx)<Math.abs(dy)*1.3)return;const events=featuredEvents(),selected=selectedFeaturedEvent(events),index=events.findIndex(e=>e.code===selected.code);selectFeaturedEvent(events[(index+(dx<0?1:-1)+events.length)%events.length].code);},{passive:true});

function repairHackathonParticipantDemo(source){
 const record=structuredClone(source),base=freshHackathonRecord(record.role),code='H02';
 record.season={...record.season,name:base.season.name,theme:base.season.theme,type:'hackathon',dates:base.season.dates.slice()};
 record.participantDemoVersion=2;record.expectedFreezeDate=base.season.dates[7];
 record.season.frozenAt=['ended','archived'].includes(record.phase)?base.season.dates[7]:null;
 record.activityProjects=[...base.activityProjects,...(record.activityProjects||[]).filter(p=>!['p1','p2','p3','hp1','hp2'].includes(p.id))];
 record.managedChallenges=base.managedChallenges.map(c=>({...c,taken:c.taken+(record.ownProject?1:0)}));
 record.works=[...base.works,...record.works.filter(w=>!['w1','w2','w3','hw1'].includes(w.id))];
 record.ledger=[...base.ledger,...record.ledger.filter(l=>!['l1','l2','l3','hl1'].includes(l.id))];
 record.judges=record.judges.map(j=>({...j,scope:j.scope==='all'?'all':'hc1'}));
 const project=record.ownProject;
 if(project?.id===code+'-my-project'){
  project.name='邻里共享行动';project.tagline='把社区里的闲置资源，交给需要的人。';project.description='围绕社区资源共享命题，访谈居民、搭建物品借用原型，再用小范围试点验证登记、借用与归还流程。';project.challenges=['hc1'];
  const titles=['8 次社区访谈：邻居愿意共享什么','共享登记原型：从发布到借用的完整流程','首轮社区试用后的 5 个关键调整'];
  const summaries=['明确居民对共享物品、安全与归还的需求','完成共享登记与借用原型和 3 次任务测试','整理社区居民的试用反馈与迭代计划'];
  for(let i=0;i<3;i++){
   const work=record.works.find(w=>w.id===code+'-my-work-'+i);if(!work)continue;
   work.title=titles[i];work.summary=summaries[i];work.body=summaries[i]+'。我们记录了真实使用过程与遇到的问题，接下来将根据反馈继续调整共享流程。';work.tag=i===1?'':'hc1';work.date=base.season.dates[2+(i>0?1:0)];
  }
  record.ledger.filter(l=>l.id.startsWith(code+'-my-score-')).forEach((l,i)=>{l.date=base.season.dates[3];l.reason=['社区访谈证据充分，居民的共享顾虑与使用需求清楚。','双侧用户反馈有价值，建议继续验证归还与物品保管机制。','共享流程原型可运行，任务测试记录完整，进入大额评分复核。'][i]||l.reason;});
  record.results.filter(r=>r.projectId===project.id).forEach(r=>{r.title='首轮社区共享试点反馈';r.description='社区居民已完成首轮试用，提交试用记录与反馈证据。';});
 }
 record.applications=[...base.applications,...record.applications.filter(a=>a.id?.startsWith('participant-demo-'))];
 record.announcements=[...base.announcements,{id:'participant-next',title:'黑客松进行中：提交共享原型与试用记录',body:'请在 11 月 11 日作品截止前整理原型和社区试用记录；评委将在 11 月 12 日评分截止前持续评价已有作品。',target:'本赛季选手',status:'published',date:base.season.dates[3],read:false}];
 return record;
}
