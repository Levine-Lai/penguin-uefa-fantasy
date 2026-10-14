import { readFile, writeFile } from "node:fs/promises";

const CURRENT_USER_GUID = "7649f634-a5a9-11f1-ad1f-b33810b58db2";
const MATCHDAY_WINDOWS = [
  { number: 1, start: "2026-09-08", end: "2026-09-10" },
  { number: 2, start: "2026-10-13", end: "2026-10-14" },
  { number: 3, start: "2026-10-20", end: "2026-10-21" },
  { number: 4, start: "2026-11-03", end: "2026-11-04" },
  { number: 5, start: "2026-11-24", end: "2026-11-25" },
  { number: 6, start: "2026-12-08", end: "2026-12-09" },
  { number: 7, start: "2027-01-19", end: "2027-01-20" },
  { number: 8, start: "2027-01-27", end: "2027-01-27" },
];

function shanghaiDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

const TODAY = process.env.UEFA_TODAY || shanghaiDateString();
const scheduledMatchday = [...MATCHDAY_WINDOWS].reverse().find((item) => item.start <= TODAY)?.number || 1;
const MATCHDAY = Number(process.env.UEFA_MATCHDAY || scheduledMatchday);
const PHASE_ID = Number(process.env.UEFA_PHASE_ID || 1);
const matchdayWindow = MATCHDAY_WINDOWS.find((item) => item.number === MATCHDAY);
const MATCHDAY_STATUS_OVERRIDE = process.env.UEFA_MATCHDAY_STATUS || (matchdayWindow && TODAY > matchdayWindow.end ? "已结束" : null);

if (!Number.isInteger(MATCHDAY) || MATCHDAY < 1 || MATCHDAY > 8) {
  throw new Error(`Invalid UEFA_MATCHDAY: ${process.env.UEFA_MATCHDAY}`);
}

const leagueMembers = {
  arctic: [
    ["AVG", "407d94d0-ab3e-11f1-9162-332b48cb9677"],
    ["Eva", "100b55e6-a63c-11f1-965e-1f74060157f4"],
    ["jingluo", "63baaca0-a943-11f1-b657-15250a1e92f9"],
    ["放棄是極其難", "59d9effa-a9b8-11f1-bb7c-9d4a507ce796"],
    ["nbw", "89c149ca-a1bb-11f1-978c-352b9083e94d"],
    ["Dream Tickets", "1a6a4f6a-aa83-11f1-b94a-bb5423dec20f"],
    ["heavy serenade", "02d501fa-99d6-11f1-9099-21824ba98c86"],
    ["蒂尔尼又没欧冠踢了", "7649f634-a5a9-11f1-ad1f-b33810b58db2"],
    ["Pluto D", "bb4836ec-991f-11f1-8c90-8d18d107a522"],
    ["座山雕", "b5cb45ae-a277-11f1-9fdd-6d0db8725bb7"],
    ["九命黑獭一统天下", "7098281e-a518-11f1-bf90-8183cab79215"],
    ["Kw拜诶噻", "5d482dc0-a8f3-11f1-abbd-ebd3cb262029"],
    ["Baros15", "295ce90a-ab6a-11f1-9423-674056fec381"],
    ["珠海兵工厂", "7bb267de-a42b-11f1-b422-1be91b8c89f0"],
    ["Jzl", "1b914a22-a8dc-11f1-8854-9b8aaf24794f"],
    ["DDDD", "d5372a2c-a9b4-11f1-9466-e5b27f9952e8"],
    ["最美95花周也大美女全球后援会", "9d02c804-a9ce-11f1-95eb-37120c597a19"],
    ["XHS公众号请关注无敌紫葱酱！", "beffe1e4-a519-11f1-9e73-c9fb9adc5f37"],
    ["dongma", "163c9dea-a811-11f1-b583-27f23818c6fa"],
    ["美式加冰", "c08daa66-a927-11f1-af0f-673f9c905f14"],
    ["johnnyocean", "f4037612-a280-11f1-8aaa-73ffe14ca92e"],
    ["Verydisco", "80363448-a7d7-11f1-a4be-590aadeedd9f"],
    ["Fitz", "4a83b406-aaca-11f1-b95f-4d1bf1577485"],
    ["KisScam", "08ea6936-a9e9-11f1-b9a4-7bff1b0db3fd"],
    ["当代丁蟹", "31bf07ac-a7f7-11f1-9c77-db2cb1c0c0b8"],
    ["W^2", "2fdfd356-a948-11f1-8361-c17873162b18"],
    ["蒂亚鸽鸽鸽", "20011dae-962f-11f1-b315-13c016d43dfd"],
    ["UEFAntasis", "76be57a4-9a19-11f1-9cfa-2d08ab3613bf"],
    ["penguin", "bf4be37a-a2e7-11f1-8592-112ca1401512"],
    ["Yamine Lmao", "5ae6b21c-a2eb-11f1-90b7-d54c15126cd4"],
    ["ZhallWin", "e661daa2-a1b9-11f1-9844-b11277887598"],
    ["Shuo", "98ae1728-a9d2-11f1-8786-91f893312729"],
    ["Chelsea Mata", "9754f4f2-ab6a-11f1-a01e-e7c1d94d13cc"],
    ["X Team", "4962df62-a5e2-11f1-9eb9-215e99730280"],
    ["JZhuoyan", "1e2a95e8-aa0f-11f1-90b3-fdbab094db3a"],
    ["kusuri", "15079cb6-a8cc-11f1-8dab-21440fc510f6"],
    ["欧冠你们的王回来了", "2ad42326-a5ab-11f1-ad1f-b33810b58db2"],
  ],
  antarctic: [
    ["爱你我不能说", "c4609564-9a03-11f1-ad15-85768370fe81"],
    ["Elliott", "737f02ee-a6e1-11f1-9410-612972c9d640"],
    ["DNMCCB", "11c842ba-a815-11f1-b63b-5fcf4fad7047"],
    ["Team Blue", "36dc5ee0-a7f4-11f1-a746-c39d9f6e388a"],
    ["FAIAAA", "31d1a75c-a295-11f1-8e5c-e3051bee5258"],
    ["remember", "d898cb4c-a740-11f1-88ff-492d669489ee"],
    ["yu99", "9ab62f2a-a5a8-11f1-942d-3f62d8e44a19"],
    ["Lens", "2d59ae56-a99b-11f1-9003-c529d75dd60c"],
    ["Yummy", "f35ed068-a6c6-11f1-a921-ad603c1a7c5f"],
    ["蒂尔尼又没欧冠踢了", "7649f634-a5a9-11f1-ad1f-b33810b58db2"],
    ["列侬贝尔两翼齐飞 我至尽还记得", "28624038-a9fb-11f1-9674-adaface3cf67"],
    ["Bill goes to EUROPA", "12888f84-a81a-11f1-8d5e-a3f41c932b19"],
    ["lulucool", "a0334822-9944-11f1-9ce6-ffc607a93689"],
    ["ZHIYU FC", "0c61e244-a8f2-11f1-8e54-213c2215da12"],
    ["Southcote Bargain", "a97d5060-991e-11f1-8c90-8d18d107a522"],
    ["Nedved", "1c5cbd1a-a922-11f1-af3b-310ab7822331"],
    ["美凌格欧冠分格", "411b709a-a2c1-11f1-80f2-b9636403f8e7"],
    ["fantasynba.cn欢迎各位大佬", "8915213a-a2f7-11f1-a2a7-219bfa7e672a"],
    ["wc1018", "aae30560-a811-11f1-b1b8-0b29a6729ad1"],
    ["Xi9Li", "f6dfd406-a9b6-11f1-b342-1d80f5a566bd"],
    ["Frank Hua", "1f80a3b8-a2f0-11f1-9b6f-df42efadfd73"],
    ["战Siu小师", "a03d3376-a779-11f1-ada4-33cd70284ec5"],
    ["halfbrain", "d7d65842-a5a0-11f1-b054-bb244304bd6d"],
    ["红衫圣殿", "201eece0-a2fe-11f1-9b32-99f69bbcb8d8"],
    ["saru", "59000b0c-aa4c-11f1-8a87-31576c242732"],
    ["光之围棋俱乐部", "101e6fc0-991a-11f1-8c73-93a143d942d6"],
    ["MutdBJ", "f3eabc3a-a4f1-11f1-b7f6-95b0f638dfe9"],
    ["联曼", "f5676392-a9c9-11f1-8825-67e7c75306d7"],
    ["换汤不换药", "c667e130-a97d-11f1-8a98-cda10bc40795"],
    ["Acidboy", "6b937064-a84f-11f1-9588-43193250d875"],
    ["TakahashiAkira", "9153d846-a23e-11f1-bc6d-29a854ec93f7"],
    ["EURO BEN", "9d14ea40-a1bb-11f1-ab3f-97e1578c9e3a"],
    ["penguin", "bf4be37a-a2e7-11f1-8592-112ca1401512"],
    ["Vamos Espana", "e531963c-aa8c-11f1-b5ae-6f0271cbfcd3"],
    ["Livy Lv", "10312a32-a87b-11f1-b382-d3349e842868"],
    ["BeatEnzoWang", "dc1342fc-a92f-11f1-be34-6fef31a48d7c"],
    ["Noodle FC", "851106c2-a580-11f1-82fb-d1e3d9336f2e"],
  ],
};

const extras = {
  arctic: new Set(["7649f634-a5a9-11f1-ad1f-b33810b58db2"]),
  antarctic: new Set(["bf4be37a-a2e7-11f1-8592-112ca1401512"]),
};

const headers = { Accept: "application/json", entity: "ed0t4n$3!" };
const playerFeedUrl = `https://gaming.uefa.com/en/uclfantasy/services/feeds/players/players_90_en_${MATCHDAY}.json`;
const playerFeed = await fetch(playerFeedUrl, { headers }).then((response) => {
  if (!response.ok) throw new Error(`Player feed HTTP ${response.status}`);
  return response.json();
});
const playerInfoById = new Map(playerFeed.data.value.playerList.map((player) => [Number(player.id), player]));

const analyticsPlayers = playerFeed.data.value.playerList
  .filter((player) => Number(player.isActive) === 1 && Number(player.value) > 0)
  .map((player) => ({
    id: Number(player.id),
    name: player.pDName || player.pFName || String(player.id),
    club: player.cCode || player.tName || "",
    points: Number(player.curGDPts ?? player.lastGdPoints ?? 0),
    price: Number(player.value || 0),
    ownership: Number(player.selPer || 0),
  }));

const takeTop = (items, compare) => [...items].sort(compare).slice(0, 25);
const byPoints = (a, b) => b.points - a.points || b.ownership - a.ownership || a.name.localeCompare(b.name);
const byOwnership = (a, b) => b.ownership - a.ownership || b.points - a.points || a.name.localeCompare(b.name);
const valueRatio = (player) => player.price > 0 ? Math.abs(player.points) / player.price : 0;
const ownershipRatio = (player) => player.ownership > 0 ? Math.abs(player.points) / player.ownership : 0;
const roundAnalytics = {
  score: takeTop(analyticsPlayers, byPoints),
  ownership: takeTop(analyticsPlayers, byOwnership),
  lowSalaryHigh: takeTop(analyticsPlayers.filter((player) => player.points > 0), (a, b) => valueRatio(b) - valueRatio(a) || byPoints(a, b)),
  highSalaryLow: takeTop(analyticsPlayers, (a, b) => valueRatio(a) - valueRatio(b) || b.price - a.price || byOwnership(a, b)),
  hiddenGems: takeTop(analyticsPlayers.filter((player) => player.points > 0 && player.ownership > 0), (a, b) => ownershipRatio(b) - ownershipRatio(a) || byPoints(a, b)),
  popularTraps: takeTop(analyticsPlayers.filter((player) => player.ownership > 0), (a, b) => ownershipRatio(a) - ownershipRatio(b) || b.ownership - a.ownership || a.name.localeCompare(b.name)),
};

async function fetchMember(region, expectedTeamName, guid) {
  const endpoint = new URL(`https://gaming.uefa.com/en/uclfantasy/services/api/Gameplay/user/${CURRENT_USER_GUID}/opponent-team`);
  endpoint.search = new URLSearchParams({ matchdayId: String(MATCHDAY), phaseId: String(PHASE_ID), opponentguid: guid }).toString();
  const payload = await fetch(endpoint, { headers }).then((response) => {
    if (!response.ok) throw new Error(`${expectedTeamName}: HTTP ${response.status}`);
    return response.json();
  });
  const value = payload?.data?.value;
  if (!value || Number(value.retval) !== 1) throw new Error(`${expectedTeamName}: invalid UEFA response`);
  const lineup = value.playerid.map((player) => {
    const playerInfo = playerInfoById.get(Number(player.id));
    return {
      id: Number(player.id),
      name: playerInfo?.pDName || playerInfo?.pFName || String(player.id),
      points: Number(player.overallpointsnew ?? player.overallpoints ?? 0),
      captain: Number(player.iscaptain) === 1,
      ...(Number(playerInfo?.mOM) === 1 && Number(playerInfo?.mOMPts) === 3 ? { manOfMatch: true } : {}),
      bench: Number(player.benchposition) > 0,
      played: Number(player.isplayed) === 1,
      position: Number(player.skill),
    };
  });
  const captain = lineup.find((player) => player.captain);
  return {
    region,
    guid,
    fantasyTeam: value.teamName || expectedTeamName,
    displayName: value.username || "",
    matchday: MATCHDAY,
    score: Number(value.gdPoints ?? 0),
    overallPoints: Number(value.ovPoints ?? 0),
    captain: captain?.name || null,
    lineup,
    status: MATCHDAY_STATUS_OVERRIDE || (Number(value.isAccounting) === 1 ? "统计中" : "进行中"),
  };
}

const all = Object.entries(leagueMembers).flatMap(([region, members]) => members.map(([teamName, guid]) => ({ region, teamName, guid })));
const records = [];
for (let index = 0; index < all.length; index += 6) {
  const batch = all.slice(index, index + 6);
  records.push(...await Promise.all(batch.map(({ region, teamName, guid }) => fetchMember(region, teamName, guid))));
}

const officialRecords = records.filter((record) => !extras[record.region].has(record.guid));
let previousSnapshot = {};
try {
  const previousSource = await readFile("uefa-live-data.js", "utf8");
  previousSnapshot = JSON.parse(previousSource.replace(/^window\.PENGUIN_UEFA_SNAPSHOT\s*=\s*/, "").replace(/;\s*$/, ""));
} catch {
  previousSnapshot = {};
}
const previousRecords = Array.isArray(previousSnapshot.records)
  ? previousSnapshot.records.filter((record) => Number(record.matchday) !== MATCHDAY)
  : [];
const previousExtras = Array.isArray(previousSnapshot.extras)
  ? previousSnapshot.extras.filter((record) => Number(record.matchday) !== MATCHDAY)
  : [];
const snapshot = {
  generatedAt: new Date().toISOString(),
  matchday: MATCHDAY,
  source: "UEFA UCL Fantasy opponent-team API",
  records: [...previousRecords, ...officialRecords],
  extras: [...previousExtras, ...records.filter((record) => extras[record.region].has(record.guid))],
  roundAnalytics: {
    ...(previousSnapshot.roundAnalytics || {}),
    [MATCHDAY]: roundAnalytics,
  },
};
await writeFile("uefa-live-data.js", `window.PENGUIN_UEFA_SNAPSHOT = ${JSON.stringify(snapshot, null, 2)};\n`, "utf8");
console.log(`Saved GD${MATCHDAY}: ${officialRecords.length} official records and ${snapshot.extras.length} extras (${MATCHDAY_STATUS_OVERRIDE || "live"}).`);
