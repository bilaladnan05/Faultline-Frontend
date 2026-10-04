import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, test } from "node:test";
import { getVoiceAgentStatus, listVoiceAgentDeliveries, requestVoiceAgentTestCall } from "../src/api/endpoints.js";

const root=resolve(import.meta.dirname,"..");
const read=(path)=>readFileSync(resolve(root,path),"utf8");
const originalFetch=globalThis.fetch;
afterEach(()=>{globalThis.fetch=originalFetch;});

test("voice-agent API functions use the administrative dashboard routes",async()=>{
  const calls=[];globalThis.fetch=async(url,options)=>{calls.push({url:String(url),method:options.method});return new Response(JSON.stringify([]),{status:200,headers:{"content-type":"application/json"}});};
  await getVoiceAgentStatus();await listVoiceAgentDeliveries();await requestVoiceAgentTestCall();
  assert.deepEqual(calls,[{url:"/api/voice-agent/status",method:"GET"},{url:"/api/voice-agent/deliveries",method:"GET"},{url:"/api/voice-agent/test-call",method:"POST"}]);
});

test("Voice Agent is an Admin-only dashboard with safe status and delivery fields",()=>{
  const app=read("src/app/App.jsx");const sidebar=read("src/components/layout/Sidebar.jsx");const page=read("src/components/voice-agent/VoiceAgentDashboard.jsx");
  assert.match(app,/path="voice-agent"[\s\S]*?<RequireRole roles=\{\[ROLES\.ADMIN\]\}>[\s\S]*?<RequireFeature feature=\{FEATURES\.VOICE_AGENT\}>/);
  const engineerMenus=sidebar.match(/engineer: \{([\s\S]*?)\n {2}\},/)?.[1];
  assert.doesNotMatch(engineerMenus,/NAV\.voiceAgent/);
  assert.match(page,/Configuration Status/);assert.match(page,/Recent Deliveries/);assert.match(page,/Test Call/);
  assert.match(page,/Admin test-call destination/);assert.match(page,/createContact/);assert.match(page,/updateContact/);
  assert.match(page,/maskedPhoneNumber/);assert.doesNotMatch(page,/apiKey|RETELL_API_KEY/);
  for(const heading of ["Incident ID","SRE Name","Phone","Call Status","Timestamp"])assert.match(page,new RegExp(heading));
});
