import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteTestTeacher, cleanupSuccessfulTeacher, validateTeacherRun } from './cleanup-teachers.mjs';

const run = () => ({ id:'REG_123456_abcdef', teacherId:'123', email:'reg_123456_abcdef@example.invalid', result:'PASS' });
function pageWith(responses, origin='https://octopus.gwodev.pl') {
  const calls=[];
  return { calls, url:()=>origin+'/teacher/teacher-panel', evaluate:async (_fn,args)=>{
    calls.push(args); assert(responses.length,'Nieoczekiwane żądanie'); return responses.shift();
  }};
}
test('nieudany test pozostawia dane bez żądań API',async()=>{
  const data={...run(),result:'FAIL'}; const page=pageWith([]);
  await cleanupSuccessfulTeacher(page,data,async()=>{});
  assert.equal(data.cleanupStatus,'KEPT_FAILED_TEST'); assert.equal(page.calls.length,0);
});
test('odrzuca nieprawidłowe ID i obcy adres e-mail',()=>{
  for(const changes of [{teacherId:'1&x=2'},{teacherId:'9007199254740993'},{email:'person@example.com'},{result:'RUNNING'}]) {
    assert.throws(()=>validateTeacherRun({...run(),...changes}));
  }
});
test('nie wysyła żądań poza dev',async()=>{
  const page=pageWith([],'https://example.com');
  await assert.rejects(deleteTestTeacher(page,run())); assert.equal(page.calls.length,0);
});
test('nie usuwa rekordu z innym e-mailem ani bez flagi Testowy',async()=>{
  for(const responses of [
    [{status:200,data:{id:123,email:'other@example.invalid'}}],
    [{status:200,data:{id:123,email:run().email}},{status:200,data:false}],
  ]) {
    const page=pageWith(responses); await assert.rejects(deleteTestTeacher(page,run()));
    assert(!page.calls.some(c=>c.method==='DELETE'));
  }
});
test('brak rekordu jest idempotentny; błąd serwera nie oznacza braku',async()=>{
  const page=pageWith([{status:204,data:null}]);
  assert.equal(await deleteTestTeacher(page,run()),'ALREADY_ABSENT');
  await assert.rejects(deleteTestTeacher(pageWith([{status:500,data:null}]),run()));
});
test('DELETE zawiera tylko własny ID i wymaga potwierdzenia braku rekordu',async()=>{
  const responses=[{status:200,data:{id:123,email:run().email}},{status:200,data:true},{status:200,data:{}},{status:204,data:null}];
  const page=pageWith(responses);
  assert.equal(await deleteTestTeacher(page,run()),'DELETED');
  assert.deepEqual(page.calls[2],{pathname:'/api/DeleteRecordsDB/DeleteRecordsFromDB',method:'DELETE',params:{jsonData:'[{"nauczycielId":123}]'}});
});
test('HTTP 200 z istniejącym rekordem zapisuje błąd sprzątania',async()=>{
  const data=run(); const teacher={status:200,data:{id:123,email:data.email}};
  const page=pageWith([teacher,{status:200,data:true},{status:200,data:{}},teacher]);
  await assert.rejects(cleanupSuccessfulTeacher(page,data,async()=>{}));
  assert.equal(data.cleanupStatus,'FAILED');
});
