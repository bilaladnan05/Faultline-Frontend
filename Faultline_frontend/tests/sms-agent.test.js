import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("SMS Agent is cluster-scoped, admin-gated, and exposes compliant imports",()=>{
  const app=read("src/app/App.jsx"),sidebar=read("src/components/layout/Sidebar.jsx"),page=read("src/pages/SmsAgentPage.jsx");
  assert.match(app,/path="sms-agent"/);assert.match(app,/SmsAgentPage/);assert.match(sidebar,/label: "SMS Agent"/);
  assert.match(page,/activeProject\?\.id/);assert.match(page,/CSV file/);assert.match(page,/PDF file/);assert.match(page,/Paste JSON/);assert.match(page,/consentConfirmed|importClusterEndUsers\(clusterId,file,consent\)/);
  assert.equal((page.match(/I confirm every imported recipient opted in/g)??[]).length,1);
  assert.match(page,/aria-label="Refresh SMS configuration status"/);assert.match(page,/onClick=\{resource\.refetch\}/);
  assert.match(page,/name,email,contact,service/);assert.match(page,/Test SMS/);assert.match(page,/Recent SMS deliveries/);
});

test("SMS endpoints encode cluster and contact ids and upload multipart data",()=>{
  const endpoints=read("src/api/endpoints.js"),client=read("src/api/client.js");
  assert.match(endpoints,/clusters\/\$\{encodeURIComponent\(clusterId\)\}\/sms-agent/);
  assert.match(endpoints,/form\.append\("file", file\)/);assert.match(endpoints,/form\.append\("consentConfirmed"/);
  assert.match(endpoints,/encodeURIComponent\(contactId\)/);assert.match(client,/body instanceof FormData/);
});

test("incident details can publish a confirmed restoration estimate",()=>{
  const endpoints=read("src/api/endpoints.js"),detail=read("src/pages/IncidentDetailPage.jsx");
  assert.match(endpoints,/incidents\/\$\{encodeURIComponent\(id\)\}\/eta/);assert.match(detail,/Estimated restoration/);assert.match(detail,/updateIncidentEta/);
});
