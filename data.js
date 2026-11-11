/* All names, amounts and dates below are demonstration data. */
const ROUTES = [
 ['seasons','火热赛季','public'],['archive','往季档案','public','seasons'],['challenges','命题库','public','seasons'],['season','赛季详情','public'],['challenge','企业命题','public'],['challenge-progress','命题进度','public','challenge'],['rankings','排行榜与赛后结果','public'],
 ['apply','个人报名','participant'],['workspace','我的赛季','participant'],['create-project','新建或带入项目','participant'],['project','我的项目','participant'],['new-work','发布赛季作品','participant','project'],['work','作品详情','participant','project'],['milestone','里程碑提交','participant','project'],['result','商业结果核验','participant','project'],['rewards','我的奖励与记录','participant'],
 ['organizer-seasons','全部赛季','organizer'],['season-create','赛季发起','organizer'],['organizer-drafts','草稿','organizer'],['organizer','赛季工作台','organizer'],['season-config','赛季配置','organizer'],['publish-check','发布检查','organizer','season-config'],['season-manage','赛程与状态','organizer'],['applications','报名与拉群','organizer'],['challenge-manage','命题管理','organizer'],['challenge-edit','命题详情','organizer','challenge-manage'],['points','评委与积分池','organizer'],['review','审核与复核','organizer'],['budget','预算与结算','organizer'],['announcements','公告','organizer'],
 ['judge','评委台','judge'],['score','作品评分','judge'],['score-guide','评分参考','judge','score'],['score-check','提交前检查','judge','score'],['my-scores','我的评分记录','judge'],
 ['enterprise','本企业命题','enterprise'],['enterprise-challenge','命题详情','enterprise','enterprise'],['challenge-draft','创建新命题','enterprise'],['enterprise-drafts','命题草稿','enterprise'],['resources','资源与交付','enterprise'],['report','命题进度','enterprise','enterprise'],['partnership','合作与出资','enterprise'],
 ['admin','赛季治理','admin'],['admin-challenges','命题管理','admin'],['organizations','主办方组织与成员','admin'],['admin-points','积分池与评委','admin'],['ledger','评分记录与纠错','admin'],['admin-results','结果、预算与结算','admin']
];
const ROLES = {visitor:'访客',participant:'参赛者',organizer:'主办方',judge:'评委',enterprise:'企业',admin:'平台管理员'};
const PHASES = {upcoming:'即将开始',active:'进行中',workClosed:'作品已截止',settling:'结算中',ended:'已定格',archived:'已归档',suspended:'已暂停',cancelled:'已取消'};
const CHALLENGES = [
 {id:'c1',symbol:'O',company:'Orion AI',name:'让园区闲置算力找到真正需要的人',type:'解决方案 / POC',description:'为中小团队建立可验证、可交易的算力撮合方案，让闲置设备产生新的价值。',resource:'测试算力 200 GPU 小时、两位技术导师、3 家园区试点',target:'完成一次真实用户测试，提交可运行原型与使用反馈。',capacity:6,taken:3,exclusive:false},
 {id:'c2',symbol:'S',company:'SheNicest',name:'把创作者的一次合作变成长久关系',type:'上下游合作',description:'为独立创作者和品牌搭建低成本的合作验证机制，让首次合作可以被持续复用。',resource:'5 个品牌访谈机会、渠道资源、商业顾问支持',target:'完成用户访谈，并形成一份双方愿意试用的合作方案。',capacity:8,taken:4,exclusive:false},
 {id:'c3',symbol:'F',company:'Field Notes',name:'把分散的产业信息变成可用的判断',type:'数据 / 研究',description:'用公开数据和一手研究，为进入新产业的团队提供有依据的决策工具。',resource:'行业数据样本、专家访谈、研究方法指导',target:'形成一个可复用的数据工具，并获得外部用户反馈。',capacity:5,taken:5,exclusive:true}
];
const PROJECTS = [
 {id:'p1',name:'园区算力拼车',tagline:'闲置算力，找到下一位使用者。',icon:'↗',challenges:['c1'],members:['程远','许知'],stage:'生长',r:'R3',growth:'认证',rVerified:true,base:0},
 {id:'p2',name:'合作便利店',tagline:'让一次创意碰面，变成可持续的合作。',icon:'✳',challenges:['c2'],members:['林可'],stage:'开花',r:'R3',growth:'认证',rVerified:true,base:0},
 {id:'p3',name:'产业小抄',tagline:'为产业新手写一本有证据的入门手册。',icon:'▦',challenges:['c3'],members:['陈默','周予'],stage:'生长',r:'R2',growth:'自述',base:0}
];
const INITIAL = {
 version:1,role:'visitor',phase:'active',registration:'closed',application:null,ownProject:null,followed:false,
 season:{name:'BoomLand 生长季',code:'S01',organizer:'Proto Seeds × SheNicest',theme:'把真实问题，做成有人用的东西。',approved:true,draft:false,budget:12000,pool:10000,ratio:1,cap:200,threshold:180,daily:false,reviewer:true,payer:'Proto Seeds',dates:['2026-11-15','2026-12-15','2026-12-19','2026-12-26','2026-12-25','2027-02-20','2027-02-27','2027-03-06']},
 works:[
  {id:'w1',projectId:'p1',title:'从 12 次访谈里，我们找到了第一个真正的需求',type:'访谈',body:'我们访谈了园区内的 12 个小团队，发现算力供给并不稀缺，难的是可信的交付。\n\n这一周，我们把原来的设备清单改成了按任务计价的匹配页，并与 3 位用户进行了首次试用。用户最关心的是运行环境、任务中断和数据安全，而不是单纯的小时价格。\n\n接下来将完成一次端到端的任务交付，验证撮合流程能否在不依赖人工协调的情况下运行。',author:'程远',authorId:'member-p1',version:1,tag:'c1',visibility:'public',date:'2026-12-22',increment:'首次发布',evidence:['12 次访谈摘要.pdf']},
  {id:'w2',projectId:'p2',title:'第一轮品牌共创试用，收到了哪些真实反馈',type:'客户反馈',body:'我们邀请了两家品牌和三位独立创作者，试用了合作需求卡。\n\n品牌希望先看可交付的样例，创作者则需要更清楚的预算和使用权范围。我们据此把合作约定调整成了三个可选择的试点包。\n\n下一步完成一个真实的小额试点，并整理双方面对面的反馈。',author:'林可',authorId:'member-p2',version:1,tag:'c2',visibility:'public',date:'2026-12-21',increment:'首次发布',evidence:['试用反馈.md']},
  {id:'w3',projectId:'p3',title:'一份产业关系图，能否帮助新人做出第一个判断',type:'研究',body:'我们整理了公开报告和专家访谈，形成第一版产业关系图。\n\n两位用户使用后反馈，最有帮助的不是覆盖面，而是每条判断后面的证据。我们决定给每个关键节点增加来源和置信说明。',author:'周予',authorId:'member-p3',version:1,tag:'c3',visibility:'public',date:'2026-12-20',increment:'首次发布',evidence:['关系图第一版.pdf']}
 ],
 ledger:[{id:'l1',workId:'w1',version:1,judgeId:'judge-lin',judge:'林舟',points:140,reason:'访谈证据充分，明确了客户需求与下一步验证方向。',reviewed:true,reversed:false,date:'2026-12-23'},{id:'l2',workId:'w2',version:1,judgeId:'judge-wen',judge:'温禾',points:110,reason:'试用反馈具体，合作约定的调整体现了真实迭代。',reviewed:true,reversed:false,date:'2026-12-22'},{id:'l3',workId:'w3',version:1,judgeId:'judge-lin',judge:'林舟',points:100,reason:'研究方法清楚，证据可追溯，建议继续扩大外部验证。',reviewed:true,reversed:false,date:'2026-12-21'}],
 judges:[{id:'judge-lin',name:'林舟',company:'Orion AI',scope:'c1',allocated:1000,active:true,conflictDisclosure:'Orion AI 命题合作方；相关评分接受独立复核'},{id:'judge-wen',name:'温禾',company:'Proto Seeds',scope:'all',allocated:800,active:true,conflictDisclosure:'Proto Seeds 主办方代表'},{id:'user-demo',name:'叶青',company:'独立评委',scope:'all',allocated:1200,active:true,conflictDisclosure:'与参赛项目无利益关系'}],
 applications:[{id:'a1',name:'苏禾',skills:'产品设计、用户研究',direction:'创作者合作',time:'每周 12 小时',status:'审核中',wechat:'demo_suhe',group:'待邀请'},{id:'a2',name:'程远',skills:'全栈开发、AI 应用',direction:'园区算力',time:'每周 15 小时',status:'已通过',wechat:'demo_cheng',group:'已加入'},{id:'a3',name:'林可',skills:'品牌运营、商业合作',direction:'创作者合作',time:'每周 10 小时',status:'候补',wechat:'demo_linke',group:'待邀请'}],
 announcements:[{id:'n1',title:'欢迎来到生长季：先把真实问题讲清楚',body:'本季采用持续发布作品、多评委滚动评分的方式。里程碑用于阶段认证，通过里程碑本身不增加项目积分。所有正式记录以平台为准。',target:'本赛季选手',date:'2026-12-19',read:false},{id:'n2',title:'作品截止与评分截止是两个不同时间点',body:'请在作品截止前提交内容和实质更新。作品截止后，评委仍可在评分截止前评价已有作品。时间均为北京时间。',target:'全体用户',date:'2026-12-20',read:false}],
 milestones:[],results:[],draftChallenges:[],disputes:[],logs:[],rewardsPaid:false,resources:['已提供','可申请','已承诺'],organizations:[{name:'Proto Seeds',owner:'温禾',members:4},{name:'SheNicest',owner:'唐可',members:3}]
};

const UPCOMING_EVENTS={
 S02:{code:'S02',name:'种子季',description:'先让十个陌生人用上你的东西',registrationDates:['2027-03-15','2027-04-15'],type:'常规赛季',dates:['2027-03-15','2027-04-15','2027-04-17','2027-04-24','2027-04-23','2027-06-19','2027-06-26','2027-07-03']}
};
const HACKATHON_EVENT={code:'H02',name:'城市黑客松',description:'两天，一次跨专业的真实共创',type:'黑客松',dates:['2026-10-20','2026-11-08','2026-11-09','2026-11-09','2026-11-09','2026-11-11','2026-11-12','2026-11-15']};
