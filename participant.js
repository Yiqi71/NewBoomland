/* Participant views share the public season data and use real prototype actions. */
const PARTICIPANT_SCENARIOS=[['active','已有项目 · 滚动评分'],['pending','报名审核中'],['waitlist','候补中'],['ready','已通过 · 等待开赛'],['team','已开赛 · 待组队'],['workClosed','作品已截止'],['settling','结算与复核'],['ended','已定格 · 奖励发放中'],['archived','已归档 · 奖励已发放'],['suspended','赛季暂停'],['cancelled','赛季取消']];
function participantDemoPicker(){openModal('参赛者演示场景',`<p class="muted">选择后会替换当前赛季的本机演示记录。其他赛季不受影响，以下均为虚构数据。</p><div class="participant-demo-options">${PARTICIPANT_SCENARIOS.map(([id,label])=>button(label,'participant-demo:'+id)).join('')}</div>`);}
function loadParticipantDemo(scenario){
 if(!PARTICIPANT_SCENARIOS.some(([id])=>id===scenario))return;
 const previous=state,code=state.season.code,records=state.organizerSeasonRecords;const source=publicActivityRecord(code)||state;
 const demo=buildParticipantDemo(scenario,code,source,records,previous,state.personaName||'叶青');
 if(state.participantPersona){demo.participantPersona=state.participantPersona;demo.personaName=state.personaName;}
 state=code==='H02'?repairHackathonParticipantDemo(demo):demo;save();closeModal();go('workspace');render();toast('已载入参赛者演示：'+PARTICIPANT_SCENARIOS.find(([id])=>id===scenario)[1]);
}
function buildParticipantDemo(scenario,code,source,records,previous,personaName='叶青'){
 const demo=structuredClone(INITIAL);demo.role='participant';demo.detailStateVersion=2;demo.participantDemo=true;demo.participantDemoScenario=scenario;demo.demoSeasonsVersion=1;
 demo.season={...demo.season,...source.season,code,dates:source.season.dates.slice(),ratio:1.5,threshold:180,budget:15000,pool:10000};
 demo.organizerSeasonRecords=records;demo.pinnedSeasonCode=previous.pinnedSeasonCode;
 demo.phase=({pending:'upcoming',waitlist:'upcoming',ready:'upcoming',team:'active'}[scenario]||scenario);demo.registration=['pending','waitlist'].includes(scenario)?'open':'closed';demo.previousPhase='active';demo.cancelledFromPhase='active';
 demo.application={id:'participant-demo-application',name:personaName,skills:'产品设计、用户研究',direction:'创作者合作',time:'每周 12 小时',status:scenario==='pending'?'审核中':scenario==='waitlist'?'候补':'已通过',group:scenario==='ready'?'已邀请':'已加入',wechat:'demo_yeqing'};
 demo.applications.push(demo.application);demo.managedChallenges=CHALLENGES.map(c=>({...structuredClone(c),status:'已发布',version:1,taken:c.taken}));
 const hasProject=!['pending','waitlist','ready','team'].includes(scenario);
 if(hasProject){
  demo.ownProject={id:code+'-my-project',name:'创作者合作手账',tagline:'让创作者与品牌把第一次合作做明白。',description:'我们把模糊的合作需求整理成预算、交付物和使用权都明确的合作卡，再用真实试点验证双方是否愿意继续合作。',members:[personaName,'许知'],challenges:['c2','c1'],stage:'生长',growth:'认证',r:'R2',base:0,visibility:'public'};
  const titles=['8 次访谈：创作者最怕的不是报价，而是范围不清','合作卡第一版：让预算与使用权一眼看懂','两家品牌试用后的 5 个关键调整'];
  demo.works.push(...titles.map((title,i)=>({id:code+'-my-work-'+i,projectId:demo.ownProject.id,title,type:['访谈','原型','客户反馈'][i],body:['访谈了 5 位独立创作者和 3 位品牌负责人。双方都希望在开始前明确交付范围、修改轮次和素材使用权。我们整理了匿名访谈摘要，并据此调整了第一版合作卡。','原型包含需求填写、预算确认、交付清单和授权范围四个步骤。三位用户完成了任务测试，其中两位可以独立完成需求确认；下一轮将减少术语并补充示例。','两家品牌完成了合作卡试用，主要反馈集中在授权期限和修改轮次。我们将下一轮验证聚焦于合同前的需求确认，并准备记录试点转化情况。'][i],summary:['明确合作前的信息缺口，形成可验证的问题假设','完成首版可交互原型和 3 次任务测试','汇总试用反馈，准备下一轮小额试点'][i],author:personaName,authorId:'user-demo',version:1,tag:i===1?'':'c2',visibility:i===2?'members':'public',date:['2026-12-22','2026-12-24','2026-12-26'][i],increment:'首次发布',evidence:[['匿名访谈摘要.pdf','需求归纳表.pdf'],['原型演示.mp4'],['试用反馈记录.pdf']][i]})));
  demo.ledger.push({id:code+'-my-score-1',workId:code+'-my-work-0',version:1,judgeId:'judge-wen',judge:'温禾',points:120,reason:'访谈问题清楚，证据能支撑合作范围不明确这一核心假设。',reviewed:true,reversed:false,date:'2026-12-23'}, {id:code+'-my-score-2',workId:code+'-my-work-0',version:1,judgeId:'user-demo',judge:'唐可',points:80,reason:'品牌与创作者双侧样本有价值，建议继续验证双方付费意愿。',reviewed:true,reversed:false,date:'2026-12-24'}, {id:code+'-my-score-3',workId:code+'-my-work-1',version:1,judgeId:'judge-wen',judge:'温禾',points:180,reason:'原型可运行，任务测试记录完整，进入大额评分复核。',reviewed:['ended','archived'].includes(scenario),reversed:false,date:'2026-12-25'});
  // The second reviewer is independent of the participant's identity.
  demo.ledger.find(l=>l.id===code+'-my-score-2').judgeId='judge-tang';demo.judges.push({id:'judge-tang',name:'唐可',company:'SheNicest',scope:'all',allocated:600,active:true,conflictDisclosure:'与参赛项目无利益关系'});
  demo.milestones=[{id:'my-m1',projectId:demo.ownProject.id,step:1,status:'已通过',workId:code+'-my-work-0',description:'问题访谈与需求证据已通过认证。'},{id:'my-m2',projectId:demo.ownProject.id,step:2,status:'待审核',workId:code+'-my-work-1',description:'已提交原型与任务测试记录，等待审核。'}];
  demo.results=[{id:'my-result',projectId:demo.ownProject.id,title:'首轮品牌合作试点反馈',level:'R3',status:'待核验',visibility:'verification',description:'两家品牌已试用，等待核验材料。'}];
  if(['ended','archived'].includes(scenario)){demo.milestones[1].status='已通过';demo.results[0].status='已核验';demo.results[0].visibility='public';demo.ownProject.r='R3';demo.ownProject.rVerified=true;}
  if(['ended','archived'].includes(scenario))demo.rewardRecords=[{projectId:demo.ownProject.id,amount:570,status:scenario==='archived'?'paid':'paying'}];
 }
 demo.rewardsPaid=scenario==='archived';demo.expectedFreezeDate='2027-03-06';demo.season.frozenAt=['ended','archived'].includes(scenario)?'2027-03-06':null;
 demo.pauseReason='主办方正在确认试点资源，恢复时间以公告为准。';demo.cancelReason='试点资源无法如期到位，主办方已公告终止本季活动。';
 demo.announcements.unshift({id:'participant-next',title:'试点材料如何整理？请先看这份说明',body:'公开作品展示方法与结论；访谈原始记录、合作凭证等私密材料请设置为仅共建成员或仅核验人员可见。',target:'本赛季选手',status:'published',date:'2026-12-26',read:false});
 return demo;
}

/* Multi-activity participant persona: one person registered across several activities. */
const MULTI_PERSONA_NAME='夏澄';
const MULTI_PARTICIPANT_ACTIVITIES=[['S01','active'],['DEMO-T','settling'],['DEMO-E','ended'],['DEMO-A','archived']];
function loadMultiParticipantPersona(){
 ensureDemoSeasons();
 const previous=state,records={...(state.organizerSeasonRecords||{})};
 for(const [code,scenario] of MULTI_PARTICIPANT_ACTIVITIES){
  const source=publicActivityRecord(code);if(!source)continue;
  const demo=buildParticipantDemo(scenario,code,source,null,previous,MULTI_PERSONA_NAME);
  demo.personaName=MULTI_PERSONA_NAME;demo.participantPersona='multi';demo.organizerSeasonRecords=null;
  records[code]=demo;
 }
 const primary=structuredClone(records[MULTI_PARTICIPANT_ACTIVITIES[0][0]]);
 primary.organizerSeasonRecords=records;primary.pinnedSeasonCode=previous.pinnedSeasonCode;primary.role='participant';
 state=primary;save();go('workspace');render();toast('已切换为参赛者 '+MULTI_PERSONA_NAME+'：已报名 '+MULTI_PARTICIPANT_ACTIVITIES.length+' 个活动');
}
function resetToSingleParticipant(){
 const fresh=structuredClone(INITIAL);fresh.role='participant';
 state=publicActivityScenario(fresh,fresh.season.code);state.role='participant';ensureDemoSeasons();save();go('workspace');render();toast('已切换为参赛者');
}
function recordProjectScore(record){const p=record.ownProject;if(!p)return 0;const ids=new Set(record.works.filter(w=>w.projectId===p.id).map(w=>w.id));return (p.base||0)+record.ledger.filter(l=>!l.reversed&&ids.has(l.workId)).reduce((s,l)=>s+l.points,0);}
function recordRewardLabel(record){
 if(record.phase==='cancelled')return '不发奖';
 const r=(record.rewardRecords||[]).find(x=>x.projectId===record.ownProject?.id);
 if(r)return ({paid:'奖励已发放',paying:'奖励发放中',approved:'奖励已核定'}[r.status]||'奖励已核定')+' · '+money(r.amount);
 if(record.phase==='settling')return '结算复核中';
 return '预计 '+money(recordProjectScore(record)*(record.season.ratio||1));
}
function personaActivityRecords(){
 if(state.participantPersona!=='multi')return [];
 const records=state.organizerSeasonRecords||{};
 return MULTI_PARTICIPANT_ACTIVITIES.map(([code])=>({code,record:code===state.season.code?state:records[code]})).filter(item=>item.record&&item.record.participantPersona==='multi');
}
function participantActivityList(){
 const items=personaActivityRecords();if(!items.length)return '';
 const statusColor={'进行中':'green','报名中':'pink','结算中':'yellow'};
 return `<section class="panel participant-activities"><div class="panel-head"><div><h2>我的活动</h2><p>你报名的全部活动：进行中的继续推进，已定格与已结算的随时回看。</p></div>${badge(items.length+' 个活动','pink')}</div><ul class="participant-activity-list">${items.map(({code,record})=>{const current=code===state.season.code;const status=activityDisplayStatus(record);return `<li class="${current?'current':''}"><div class="participant-activity-main"><strong>${esc(record.season.name)}</strong><span class="small muted">${esc(record.season.organizer)} · ${esc(record.season.dates[2]||'待公布')} — ${esc(record.season.dates[6]||'待公布')}</span></div><div class="chips">${badge(status,statusColor[status]||'')}${badge(recordRewardLabel(record))}</div><div class="participant-activity-score"><b>${recordProjectScore(record)}</b><small>积分</small></div>${current?badge('当前查看','pink'):button('进入','switch-my-activity:'+code,'sm')}</li>`;}).join('')}</ul></section>`;
}
function participantNext(){
 const p=state.ownProject,a=state.application,phase=state.phase;
 if(phase==='cancelled')return {title:'赛季已取消',text:'积分与作品保留为档案，本季不发放奖励。',label:'查看赛季记录',route:'rewards'};
 if(phase==='suspended')return {title:'赛季暂时停下，已有进展会保留',text:state.pauseReason||'报名、作品发布和评分已暂停，等待主办方公告。',label:'发布已暂停',disabled:true};
 if(['ended','archived'].includes(phase))return {title:'这一季的努力，已经留下记录',text:'查看最终积分、奖励发放状态与参与记录。',label:'我的赛季记录',route:'rewards'};
 if(phase==='settling')return {title:'成绩正在复核与结算',text:'查看评分与复核记录；对记录有疑问可在奖励页提出异议。',label:'查看复核与异议',route:'rewards'};
 if(!a)return {title:'先了解赛季，找到适合你的共创机会',text:'前往火热赛季，了解各赛季的主题、赛程与参与方式。',label:'了解赛季',route:'seasons'};
 if(a.status!=='已通过')return {title:a.status==='候补'?'你正在候补队列中':a.status==='审核中'||a.status==='待定'?'报名资料已提交，等待审核':'查看本次报名结果',text:a.status==='候补'?'递补结果会通过站内公告通知，请关注消息。':'审核结果与补充说明将在这里更新。',label:'查看报名状态',route:'workspace'};
 if(!p)return phase==='upcoming'?{title:'报名已通过，等开赛再出发',text:'开赛后可发起或带入项目，现在可以先认识队友。',label:'找队友',route:'talent'}:{title:'把想解决的问题，变成你的项目',text:'可单人开始，也可与已通过报名的队友一起登记，选择平行命题。',label:'发起或带入项目',route:'create-project'};
 if(phase==='workClosed')return {title:'作品提交已截止，评分仍在进行',text:'已有作品继续接受评委评分，查看每位评委的意见与复核进度。',label:'查看评分',route:'project'};
 return {title:'把最新一次真实进展，整理成作品',text:'访谈、原型、试用与复盘都能留下证据。发布后由评委独立评分。',label:'发布赛季作品',route:'new-work'};
}
function participantLink(route,label,kind=''){return seasonDetailAction(route,label,kind);}
function participantAction(){const n=participantNext();return n.disabled?button(n.label,'','primary',true):participantLink(n.route,n.label,'primary');}
function participantReward(){const p=state.ownProject,r=(state.rewardRecords||[]).find(r=>r.projectId===p?.id),score=p?projectScore(p):0;return {amount:state.phase==='cancelled'?0:r?.amount??score*state.season.ratio,label:state.phase==='cancelled'?'不发奖':r?({paid:'已发放奖励',paying:'已核定 · 发放中',approved:'已核定奖励'}[r.status]||'已核定奖励'):state.rewardsPaid?'已发放奖励':'预计奖金',foot:r||state.rewardsPaid?'按项目记录，个人分配另行确认':'预计·未结算，积分归项目'};}
function participantSummary(){const p=state.ownProject,a=state.application,n=participantNext(),reward=participantReward();const works=state.works.filter(w=>w.projectId===p?.id);return `<section class="participant-summary panel"><div class="participant-summary-top"><div><div class="eyebrow">MY SEASON / ${esc(state.season.code)}</div><h2>${esc(p?.name||'我的参赛进度')}</h2><p>${esc(p?.tagline||'从一次行动开始，让想法慢慢生长。')}</p></div>${badge(p?activityDisplayStatus():a?.status||'尚未报名','pink')}</div><div class="chips">${p?badge(p.stage+' · '+(p.growth||'自述'))+projectTags(p):''}${a?badge('报名：'+a.status):''}${a?.status==='已通过'?badge('微信群：'+(a.group||'待邀请')):''}</div>${p&&guestScoringEnabled()?`<div class="participant-metrics">${stat('项目总积分',projectScore(p),'多位评委评分累计')}${stat(reward.label,money(reward.amount),reward.foot)}${stat('赛季作品',works.length,'公开与团队作品均包含')}</div>`:''}<div class="participant-next"><div><span class="participant-kicker">我的下一步</span><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p></div><div class="participant-next-actions">${participantAction()}${p?participantLink('project','进入项目',''):''}</div></div></section>`;}
function participantWorks(){const p=state.ownProject,works=state.works.filter(w=>w.projectId===p?.id).slice().sort((a,b)=>b.date.localeCompare(a.date));return `<section class="panel" id="participant-works"><div class="panel-head"><div><h2>我的作品与评分</h2><p>每次进展都有记录，每笔评分都能追溯。</p></div>${badge(works.length+' 件作品')}</div>${works.length?works.map(w=>{const reviews=effective().filter(l=>l.workId===w.id&&l.version===w.version),pending=reviews.some(l=>!l.reviewed);return `<article class="participant-work"><div class="row between"><div class="chips">${badge(w.type)}${badge(w.visibility==='public'?'公开':'仅团队可见')}${badge(pending?'待复核':reviews.length?'已评分':'待评分',pending?'yellow':reviews.length?'green':'')}</div><span class="small muted">${esc(w.date)} · V${w.version}</span></div><h3>${participantLink('work?id='+w.id,w.title,'participant-work-title')}</h3><p>${esc(w.summary||w.increment)}</p><div class="participant-score-line"><strong>${workScore(w)} <small>积分</small></strong><span>${reviews.length?'来自 '+reviews.length+' 位评委':'等待评委评价'}</span></div>${reviews.map(l=>`<div class="participant-review"><span>${esc(l.judge)} <b>+${l.points}</b> ${!l.reviewed?badge('待复核','yellow'):''}</span><p>${esc(l.reason)}</p></div>`).join('')}</article>`;}).join(''):empty('还没有赛季作品',p?'把真实进展和证据整理出来，开始持续留痕。':'登记项目后，你和队友的作品会出现在这里。') }</section>`;}
function participantTasks(){const p=state.ownProject,works=state.works.filter(w=>w.projectId===p?.id),pending=effective().filter(l=>works.some(w=>w.id===l.workId)&&!l.reviewed).length,m=state.milestones.filter(m=>m.projectId===p?.id&&m.status==='待审核').length,r=state.results.filter(r=>r.projectId===p?.id&&r.status==='待核验').length;return panel('需要关注','评分与认证进度会在这里更新。',p?`<ul class="participant-task-list"><li><span>评分待复核</span>${badge(pending+' 笔',pending?'yellow':'')}</li><li><span>阶段认证审核中</span>${badge(m+' 项')}</li><li><span>商业结果待核验</span>${badge(r+' 项')}</li></ul><p class="small muted">以上事项由评委或授权人员处理，你可以查看记录。</p>${participantLink('project','查看项目进展','sm')}`:empty('先完成当前一步',participantNext().text));}
function participantDeadlines(){return panel('本季关键时间',state.participantDemo?'演示赛程 · 北京时间':'北京时间 · 以赛季公告为准',`<ul class="participant-deadlines">${[['开赛',2],['组队截止',3],['命题冻结',4],['作品截止',5],['评分截止',6]].map(([label,i])=>`<li class="${label==='作品截止'?'highlight':''}"><span>${label}</span><strong>${esc(state.season.dates[i]||'待公布')}</strong></li>`).join('')}</ul>`);}
function participantNotices(){const notices=state.announcements.filter(n=>!n.target||['全体用户','all','本赛季选手'].includes(n.target)).slice(0,3);return panel('与我相关的公告','规则与赛程调整请及时查看。',notices.length?notices.map(n=>`<div class="participant-notice"><button class="link" data-action="read-notice:${esc(n.id)}">${!n.read?'<i class="participant-dot"></i>':''}${esc(n.title)}</button><p class="small muted">${esc(n.date)}</p></div>`).join(''):empty('暂无新公告'));}
function participantDashboard(){return `<div class="participant-columns"><div class="participant-main">${participantWorks()}${state.ownProject?panel('阶段认证','里程碑用于认证项目阶段，通过本身不增加积分。',`<div class="participant-stage-row">${[1,2,3,4].map(step=>{const m=state.milestones.find(m=>m.projectId===state.ownProject.id&&m.step===step);return `<div><strong>M${step}</strong>${badge(m?.status||'未提交',m?.status==='已通过'?'green':'')}</div>`;}).join('')}</div>${participantLink('milestone','查看下一里程碑','sm')}`):''}</div><aside class="participant-aside">${participantTasks()}${participantDeadlines()}${participantNotices()}</aside></div>`;}
function participantWorkspacePage(){return layout(`<div class="participant-workspace">${pageHead('我的赛季','先看进展，再迈出下一步。',button('切换演示场景','participant-demo-picker','sm')+participantLink('season?code='+state.season.code,'查看公开赛季','sm'))}<div class="participant-season-strip">${badge(activityDisplayStatus(),'pink')}<strong>${esc(state.season.name)}</strong><span>${esc(state.season.organizer)}</span>${state.participantDemo?badge('演示数据'):''}</div>${participantActivityList()}${participantSummary()}${participantDashboard()}${panel('奖励与赛季记录','项目成绩、个人参与和奖励状态分别保留。',participantLink('rewards','我的奖励与记录','sm'))}</div>`,'participant');}
function participantSeasonBody(){return `<div class="participant-season-heading"><div>${seasonPosterBadges()}<h1>${esc(state.season.name)}</h1><p>${esc(state.season.theme)}</p></div>${participantLink('workspace','我的赛季工作台','')}</div>${phaseNotice()}${participantSummary()}${participantDashboard()}<details class="participant-public-details"><summary>浏览本季公共信息 · 项目、榜单、命题与规则</summary>${guestPhaseContent()}</details>`;}
PAGES.workspace=participantWorkspacePage;

function participantRewardsPage(){const p=state.ownProject,r=participantReward();return layout(`${pageHead('我的奖励与记录','每一季的参与、成绩与奖励，都有清楚的记录。')}<div class="grid cols-3">${stat('项目贡献积分',p?projectScore(p):0,'积分归项目，不自动平分给成员')}${stat(r.label,money(r.amount),r.foot)}${stat('本人发布作品',state.works.filter(w=>w.projectId===p?.id&&w.authorId===actor).length,'过程记录会随赛季保留')}</div>${sectionHead('我的赛季记录')}${table(['赛季','项目与角色','阶段与成果','积分','奖励状态'],p?[[esc(state.season.name),esc(p.name)+'<span class="sub">发起人 · '+esc(p.members.join('、'))+'</span>',esc(p.stage)+' · '+esc(p.growth||'自述')+' / '+esc(p.r||'R0'),projectScore(p),badge(r.label,'pink')+'<span class="sub">'+money(r.amount)+'</span>']]:[])}${p?panel('参与证据','项目命题与阶段认证会随记录保存。',`<div class="chips">${projectTags(p)}</div><p class="muted">已通过 ${state.milestones.filter(m=>m.projectId===p.id&&m.status==='已通过').length} 项阶段认证，发布 ${state.works.filter(w=>w.projectId===p.id&&w.authorId===actor).length} 件作品。</p>${participantLink('project','查看项目记录','sm')}`):''}${sectionHead('对记录有疑问？')}${panel('评分复核与异议','对评分或结算记录有疑问，可提交说明并跟进处理状态。',button('提交异议','new-dispute')+((state.disputes||[]).length?table(['事项','处理状态'],state.disputes.map(d=>[esc(d.title),badge(d.status)])):''))}`,'participant');}
PAGES.rewards=participantRewardsPage;
