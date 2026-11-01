import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(new URL('../frontend/package.json',import.meta.url));
const {JSDOM}=require('jsdom');const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost:8080'});
for(const key of ['window','document','HTMLElement','HTMLInputElement','Event','MouseEvent'])globalThis[key]=dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{render,screen,fireEvent,waitFor,cleanup}=require('@testing-library/react');
const {MemoryRouter}=require('react-router-dom');
const {createServer}=await import('../frontend/node_modules/vite/dist/node/index.js');
const server=await createServer({root:fileURLToPath(new URL('../frontend/',import.meta.url)),server:{middlewareMode:true},appType:'custom'});
try{
 const {api}=await server.ssrLoadModule('/src/services/api.js');
 let patches=0;
 api.platform=async(path,token,body,method)=>{
  if(method==='PATCH'){patches++;return {message:'unexpected'};}
  return path==='/tickets'?[{ticketId:1,subject:'Yêu cầu đã đóng'}]:{ticket_id:1,subject:'Yêu cầu đã đóng',status:'CLOSED',messages:[{message_id:1,full_name:'Hỗ trợ',message_text:'Lịch sử hỗ trợ vẫn đọc được.'}]};
 };
 const {default:Operations}=await server.ssrLoadModule('/src/components/Operations.jsx');
 render(React.createElement(MemoryRouter,null,React.createElement(Operations,{page:'ticket-chat',auth:{accessToken:'test',user:{role:'STUDENT'}},data:{tickets:[]},catalog:[]})));
 fireEvent.change(screen.getByLabelText('Mã ticket'),{target:{value:'1'}});
 fireEvent.click(screen.getByRole('button',{name:'Mở',exact:true}));
 await waitFor(()=>assert.ok(screen.getByText('Lịch sử hỗ trợ vẫn đọc được.')));
 assert.equal(screen.getByLabelText('Trả lời ticket').disabled,true);
 assert.equal(screen.getByRole('button',{name:'Lưu và gửi trả lời'}).disabled,true);
 assert.ok(screen.getByText(/Yêu cầu đã đóng. Bạn có thể xem lịch sử/));
 assert.equal(patches,0);
 console.log('PASS Closed history readable, input/send disabled, clear explanation, no reply submitted');
}finally{cleanup();await server.close();dom.window.close();}
