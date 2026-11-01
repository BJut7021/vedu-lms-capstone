// Editable editorial cover art. Each scene represents the actual course tasks.
// Microsoft icons are supplied separately by the build script from Microsoft's CDN.
const escape = (s) => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const configs = [
 ['word',/word/,['Word','thực hành'],'Báo cáo · Styles · Hồ sơ','#edf4ff','#193e73','#3377d0','VĂN PHÒNG'],
 ['excel',/excel/,['Excel','thực hành'],'Công thức · Chi phí · Báo cáo','#edf7f0','#1c513d','#298959','VĂN PHÒNG'],
 ['powerpoint',/powerpoint/,['PowerPoint','thực hành'],'Slide · Bố cục · Thuyết trình','#fff0e8','#7b3a2b','#d66b45','VĂN PHÒNG'],
 ['literacy',/tìm kiếm.*đánh giá/,['Thông tin số','& tư duy phản biện'],'Tìm kiếm · Kiểm chứng · Ghi nguồn','#edf1ff','#334b83','#6b84c8','KỸ NĂNG SỐ'],
 ['digital',/kỹ năng số/,['Làm việc số','an toàn hơn'],'Tệp · Cộng tác · An toàn email','#153842','#f3faf8','#78c9b1','KỸ NĂNG SỐ'],
 ['discrete',/rời rạc/,['Cấu trúc','rời rạc'],'Đồ thị · Logic · Phép đếm','#f7efdf','#4b435d','#8a6eaa','NỀN TẢNG CNTT'],
 ['networkLab',/thực hành quản trị/,['Quản trị','hệ thống mạng'],'DHCP · DNS · AD DS · Lab','#173844','#f5fbfb','#78c9d5','PHÒNG THỰC HÀNH'],
 ['networks',/mạng máy tính/,['Mạng','máy tính'],'TCP/IP · Địa chỉ IP · Kết nối','#eaf3f7','#244b65','#4388a3','NỀN TẢNG CNTT'],
 ['oop',/hướng đối tượng/,['Lập trình','hướng đối tượng'],'C# · Kế thừa · Đa hình','#f1edf9','#4f3b74','#8164ae','LẬP TRÌNH'],
 ['systemsLab',/thực hành phân tích/,['Phân tích thiết kế','hệ thống · Lab'],'Khảo sát · Mô hình · Hồ sơ thiết kế','#f9eef2','#71465d','#b17a94','PHÒNG THỰC HÀNH'],
 ['systems',/phân tích thiết kế/,['Phân tích','thiết kế hệ thống'],'Yêu cầu · UML · Thiết kế','#eaf4ef','#31594d','#5d9984','THIẾT KẾ PHẦN MỀM'],
 ['dsa',/cấu trúc dữ liệu/,['Cấu trúc dữ liệu','& giải thuật'],'Danh sách · Cây · Tìm kiếm','#fbf0e5','#754b33','#c28050','LẬP TRÌNH'],
 ['deepLab',/thực hành học sâu/,['Thực hành','Học sâu'],'TensorFlow · CNN · RNN · LSTM','#fff0e4','#79502f','#d58b4e','PHÒNG THỰC HÀNH'],
 ['deep',/học sâu/,['Học sâu'],'Mạng nơ-ron · Huấn luyện · CNN','#1c2339','#f7f5ff','#b6a2e5','DỮ LIỆU & AI'],
 ['mining',/khai phá/,['Khai phá','dữ liệu'],'Tiền xử lý · Phân lớp · Gom cụm','#edf2fb','#354c79','#718fc6','DỮ LIỆU & AI'],
 ['testing',/kiểm định/,['Kiểm định','phần mềm'],'Test case · Kiểm thử · Báo cáo lỗi','#fff0ed','#7b3e3d','#cc8074','CHẤT LƯỢNG PHẦN MỀM'],
 ['techniques',/kỹ thuật lập trình/,['Kỹ thuật','lập trình'],'C++ · Mảng · Đệ quy · Kiểm thử','#eaf0f9','#354b70','#718bb5','LẬP TRÌNH'],
 ['opensource',/mã nguồn mở/,['Lập trình','mã nguồn mở'],'PHP · MVC · Cơ sở dữ liệu','#efecfa','#514579','#8d7ab8','PHÁT TRIỂN PHẦN MỀM'],
 ['python',/python/,['Python','cơ bản'],'Biến · Hàm · List · Dictionary','#fff6df','#5b5131','#c3a149','BẮT ĐẦU LẬP TRÌNH'],
 ['bigdata',/big data/,['Nhập môn','Big Data'],'Dữ liệu lớn · Hadoop · Spark','#e8f4f0','#285c54','#68a799','DỮ LIỆU & AI'],
 ['aiLab',/trí tuệ nhân tạo/,['Thực hành','Trí tuệ nhân tạo'],'Tìm kiếm · Suy diễn · Học máy','#eef5e6','#3b6038','#81a36d','PHÒNG THỰC HÀNH'],
];
export function catalogCoverInfo(course) {
 const name=String(course.title||course.courseName||'').normalize('NFC').toLocaleLowerCase('vi-VN');
 const row=configs.find(c=>c[1].test(name));
 if(!row)return null;
 const [kind,,lines,subtitle,paper,ink,accent,category]=row;
 return {kind,lines,headline:lines.join(' '),subtitle,paper,ink,accent,category};
}
const rect=(x,y,w,h,fill='#fff',r=18,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const text=(x,y,s,size=24,color='#34465b',weight=500,extra='')=>`<text x="${x}" y="${y}" fill="${color}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}" ${extra}>${escape(s)}</text>`;
const line=(x1,y1,x2,y2,color='#aebccc',width=4,extra='')=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round" ${extra}/>`;
const node=(x,y,label,fill,ink='#fff',radius=32)=>`<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}"/>${text(x,y+8,label,24,ink,700,'text-anchor="middle"')}`;
const check=(x,y,color='#4c9d7c')=>`<path d="M${x} ${y+7}l8 8 17-21" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
const shadow=(content,transform='')=>`<g filter="url(#shadow)" transform="${transform}">${content}</g>`;
const window=(label,body,color='#4d6f95',x=480,y=118,w=660,h=432)=>shadow(`${rect(x,y,w,h,'#fff',22)}${rect(x,y,w,48,color,22)}${rect(x,y+27,w,21,color,0)}${[0,1,2].map(i=>`<circle cx="${x+23+i*18}" cy="${y+24}" r="5" fill="white" opacity="${.9-i*.2}"/>`).join('')}${text(x+92,y+31,label,20,'#fff',600)}${body}`);
const pill=(x,y,s,accent='#436e9b')=>`${rect(x,y,Math.max(100,s.length*11+34),38,'#fff',19)}${text(x+17,y+26,s,18,accent,700)}`;
function officeScene(info,logos){
 const {kind,accent}=info;
 let art;
 if(kind==='word'){
  art=shadow(`${rect(567,80,511,489,'#c2d7f2',12)}`,'rotate(5 822 325)')+
   window('Word · Báo cáo nhóm',`${rect(499,184,141,329,'#edf3fc',8)}${text(516,216,'STYLES',16,accent,700)}${rect(512,234,115,38,'#d5e4f9',5)}${text(522,260,'Heading 1',16,accent,700)}${text(522,305,'Heading 2',16)}${line(516,343,620,343)}${line(516,368,605,368)}${rect(668,187,421,334,'#f9fbff',8)}${text(693,226,'BÁO CÁO TIẾN ĐỘ',23,'#234d82',700)}${text(693,261,'01  Mục tiêu và phạm vi',18,accent,700)}${line(693,285,1059,285,'#c1cede',3)}${line(693,306,1035,306,'#c1cede',3)}${line(693,327,1059,327,'#c1cede',3)}${text(693,371,'02  Kết quả thực hiện',18,accent,700)}${rect(692,390,367,81,'#e1ecfb',7)}${[0,1,2].map(i=>line(710,409+i*21,1038-i*18,409+i*21,'#94b4d9',3)).join('')}`,accent)+pill(752,572,'Styles → Mục lục',accent);
 }else if(kind==='excel'){
  const rows=[['Hạng mục','Số lượng','Thành tiền'],['Vở A5','10','120.000'],['Bút bi','20','100.000'],['Bìa hồ sơ','5','40.000'],['Tổng','','260.000']];
  const cells=rows.map((row,i)=>row.map((v,j)=>`${rect(499+j*199,209+i*45,197,43,i===0?accent:i===4?'#deeee3':i%2?'#f1f7f3':'#fff',0)}${text(511+j*199,237+i*45,v,i===0?17:19,i===0?'#fff':'#36594a',i===0||i===4?700:500)}`).join('')).join('');
  art=window('Excel · Sổ chi phí',`${rect(500,177,594,28,'#edf5ef',5)}${text(514,198,'fx   =SUM(D2:D4)',17,accent)}${cells}${line(515,488,1080,488,'#d5e3d8',2)}${[85,118,55,98,140,104].map((h,i)=>rect(548+i*76,494-h*.3,42,h*.3,i%2?'#8bbb9d':accent,3)).join('')}`,accent)+shadow(`${rect(882,443,241,126,'#fff',16)}${text(903,478,'TỔNG CHI PHÍ',16,'#527561',700)}${text(902,522,'260.000 ₫',34,accent,700)}${check(1071,478,accent)}`);
 }else{
  art=window('PowerPoint · Thuyết trình dự án',`${rect(499,181,106,338,'#f9ebe5',8)}${[0,1,2,3].map(i=>`${rect(512,196+i*77,79,53,i===1?'#e1a284':'#fff',5)}${line(524,211+i*77,575,211+i*77,'#c2a291',3)}${line(524,224+i*77,559,224+i*77,'#c2a291',3)}`).join('')}${rect(626,183,467,294,'#faeee5',8)}${text(651,224,'DỰ ÁN HỌC TẬP',15,accent,700)}${text(651,270,'Ý tưởng rõ ràng.',26,'#744333',700)}${text(651,307,'Trình bày thuyết phục.',22,'#744333',700)}${line(651,340,859,340,'#c7a58e',4)}${line(651,361,823,361,'#c7a58e',4)}${[64,99,140].map((h,i)=>rect(943+i*43,427-h,27,h,['#e8b895',accent,'#78a6ae'][i],3)).join('')}${rect(627,493,466,29,'#f7f0ea',5)}${text(641,514,'01  Vấn đề     02  Giải pháp     03  Minh chứng',15,'#8c6854')}`,accent)+pill(799,573,'6 slide · 5 phút',accent);
 }
 const logo=logos[kind];
 return art+(logo?shadow(`<image href="${logo}" x="58" y="92" width="140" height="140"/>`):'');
}
function scene(info){
 const {kind,accent}=info;
 switch(kind){
 case 'discrete': {
  const points=[[620,216],[793,181],[1014,235],[1012,424],[803,491],[608,413]],edges=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,4],[1,4],[1,3]];
  return shadow(`${rect(493,127,627,430,'#fffdf7',24)}${text(521,168,'G = (V, E)',25,'#675279',700)}${edges.map(([a,b])=>line(...points[a],...points[b],'#b9a7c5',4)).join('')}${points.map(([x,y],i)=>node(x,y,String.fromCharCode(65+i),['#8a6eaa','#b48a55','#649c91'][i%3])).join('')}`)+pill(841,562,'P ∧ Q  ⇒  P',accent);
 }
 case 'dsa':
  return shadow(`${rect(494,99,625,459,'#fffaf3',24)}${text(523,143,'DỮ LIỆU → THUẬT TOÁN',20,'#906342',700)}${text(523,195,'MẢNG',17,'#8b6b52',700)}${[4,8,15,16,23,42].map((v,i)=>`${rect(524+i*91,215,78,64,i===3?'#d9a272':'#f0dfcb',8)}${text(562+i*91,256,v,25,'#774b32',700,'text-anchor="middle"')}${text(562+i*91,302,i,15,'#9b8064',500,'text-anchor="middle"')}`).join('')}${line(805,360,662,437,'#c5a387',5)}${line(805,360,970,437,'#c5a387',5)}${node(805,359,'16','#b47c50')}${node(662,438,'8','#d3a47d')}${node(970,438,'42','#8ca89a')}${text(523,527,'Tìm kiếm · Sắp xếp · Cây nhị phân',19,'#967252')}`)+pill(881,578,'O(log n)',accent);
 case 'networks':
  return shadow(`${rect(493,114,637,438,'#f8fcfd',24)}${rect(720,258,190,72,'#3c7d99',13)}${text(747,302,'ROUTER',23,'#fff',700)}${line(812,249,812,194,accent,5)}${line(712,295,609,295,accent,5)}${line(916,295,1023,295,accent,5)}${line(765,339,668,432,accent,5)}${line(868,339,968,432,accent,5)}${[[559,259],[974,259],[615,416],[921,416]].map(([x,y])=>`${rect(x,y,98,65,'#d8e8ed',8)}${rect(x+9,y+8,80,45,'#78a7b9',4)}${line(x+49,y+65,x+49,y+81,'#6e95a4',4)}${line(x+25,y+82,x+73,y+82,'#6e95a4',4)}`).join('')}${rect(753,147,119,48,'#fff',8)}${text(768,179,'Internet',20,'#4b7990',700)}${text(544,499,'192.168.1.0 / 24',26,'#3c6e85',700)}`)+pill(888,569,'TCP / IP',accent);
 case 'networkLab':
  return window('Server Manager · Phòng lab',`${rect(502,184,200,331,'#183f4c',10)}${['AD DS','DNS','DHCP','IPAM'].map((s,i)=>`${rect(520,206+i*68,164,45,i===1?'#397887':'#244f5e',7)}${text(539,236+i*68,s,23,'#d9f3f7',700)}`).join('')}${text(730,215,'KIỂM CHỨNG DỊCH VỤ',19,'#416776',700)}${['Domain controller','DNS resolution','DHCP lease'].map((s,i)=>`${rect(727,242+i*71,367,54,'#edf5f6',8)}${text(743,276+i*71,s,20,'#365c68')}${check(1050,262+i*71,'#4d9b89')}`).join('')}${rect(729,467,364,43,'#234c59',6)}${text(741,495,'PS> Get-DhcpServerv4Lease',17,'#c5e8ec')}`,'#356b7b');
 case 'oop':
  return window('C# · Lớp và đối tượng',`${text(514,205,'abstract class Hinh',25,accent,700)}${text(514,244,'{  DienTich();  }',22,'#61718a')}${rect(741,284,174,70,'#e1d9f1',10)}${text(774,329,'Hinh',27,'#65518c',700)}${line(828,358,655,437,'#aa94c6',5)}${line(828,358,1003,437,'#aa94c6',5)}${rect(523,430,250,79,'#edf1fa',12)}${text(546,477,'HinhVuong',24,'#516c95',700)}${rect(886,430,220,79,'#edf6f0',12)}${text(912,477,'HinhTron',24,'#54866a',700)}`,accent)+pill(880,577,'C# · .NET',accent);
 case 'systems':
  return shadow(`${rect(493,101,631,460,'#fcfefc',23)}${text(524,145,'TỪ YÊU CẦU ĐẾN MÔ HÌNH',20,'#456f60',700)}<circle cx="568" cy="221" r="19" fill="#aacbb9"/>${line(568,242,568,299,'#6d9986',5)}${line(543,266,594,266,'#6d9986',5)}${line(568,300,543,331,'#6d9986',5)}${line(568,300,592,331,'#6d9986',5)}<ellipse cx="770" cy="260" rx="110" ry="47" fill="#e0efe5" stroke="#7ba68e" stroke-width="3"/>${text(704,268,'Ghi danh học',20,'#4a735b',700)}${line(595,264,656,264,'#87a697',3)}${rect(945,186,146,134,'#edf1f8',10)}${text(960,224,'Course',22,'#55718d',700)}${line(957,242,1078,242,'#b0bdcb',2)}${text(959,271,'courseId',16)}${text(959,298,'enroll()',16)}${['Yêu cầu','Use case','Thiết kế'].map((v,i)=>`${rect(527+i*192,412,166,87,['#dcebe1','#e8e1f0','#dce9f2'][i],10)}${text(545+i*192,464,v,21,'#4b6d63',700)}`).join('')}`);
 case 'systemsLab':
  return shadow(`${rect(502,113,622,438,'#fffafd',22)}${text(532,159,'HỒ SƠ PHÂN TÍCH · THƯ VIỆN',20,'#99647e',700)}${rect(535,191,330,238,'#fff',9,'stroke="#e3ced8" stroke-width="2"')}${text(554,225,'Đặc tả: Mượn sách',21,'#9b5d7c',700)}${[0,1,2,3].map(i=>`${rect(556,250+i*37,12,12,'#cda5b8',2)}${line(580,256+i*37,833-i*23,256+i*37,'#d0bac5',4)}`).join('')}${rect(904,203,172,194,'#ede6f2',11)}${text(926,240,'ERD',22,'#84628f',700)}${rect(927,258,125,44,'#fff',6)}${text(946,287,'Độc giả',16)}${line(990,309,990,329,'#ad92b7',3)}${rect(927,336,125,43,'#fff',6)}${text(944,363,'Phiếu mượn',15)}${rect(536,454,540,56,'#f4e6ec',9)}${text(554,489,'Khảo sát  →  UML  →  Kiểm thử truy vết',20,'#8d5975',700)}`);
 case 'deep': {
  const columns=[[558,270,3],[717,218,5],[886,245,4],[1040,297,2]],points=columns.map(([x,y,n])=>Array.from({length:n},(_,i)=>[x,y+i*53]));
  return `${points.slice(0,-1).map((col,i)=>col.map(a=>points[i+1].map(b=>line(...a,...b,'#6c6290',2,'opacity=".5"')).join('')).join('')).join('')}${points.map((col,i)=>col.map(([x,y])=>node(x,y,'',['#88b4c5','#9b87ca','#bfa8de','#dfbd8e'][i],'#fff',16)).join('')).join('')}${text(512,179,'NEURAL NETWORK',23,'#dfd4f4',700)}${text(529,529,'Input',18,'#9bb9cd')}${text(746,554,'Hidden layers',18,'#b8a7d5')}${text(1017,499,'Output',18,'#ddc6a2')}${pill(870,589,'Gradient ↓','#71559b')}`;
 }
 case 'deepLab':
  return window('Notebook · Huấn luyện mô hình',`${rect(500,183,589,91,'#fff5e9',8)}${text(515,214,'model.fit(X_train, y_train,',20,'#ad6a35',700)}${text(538,247,'validation_data=(X_val, y_val))',19,'#6c7c8e')}${text(521,312,'LOSS',16,'#9b795c',700)}${line(540,462,540,331,'#cab6a1',3)}${line(540,462,835,462,'#cab6a1',3)}<path d="M555 350Q590 406 634 421T710 442T814 448" fill="none" stroke="#d78e49" stroke-width="5"/><path d="M555 361Q594 399 635 407T725 421T814 414" fill="none" stroke="#77a69e" stroke-width="4" stroke-dasharray="8 5"/>${rect(885,314,195,154,'#f7eddf',12)}${text(906,350,'EPOCH',17,'#a57850',700)}${text(906,398,'08 / 20',32,'#a26738',700)}${text(906,436,'train / validation',15,'#8c735b')}`,'#c88c56')+pill(812,576,'TensorFlow · Lab','#ae713d');
 case 'mining': {
  const dots=Array.from({length:36},(_,i)=>{const k=i%3,x=568+k*169+(i*47%83),y=258+(i*37%181);return `<circle cx="${x}" cy="${y}" r="${i%4+5}" fill="${['#6b8fc5','#c7947b','#79aaa6'][k]}" opacity=".8"/>`;}).join('');
  return shadow(`${rect(496,114,629,440,'#fff',24)}${text(525,159,'KHÁM PHÁ MẪU TRONG DỮ LIỆU',19,'#5b74a2',700)}${rect(526,185,566,52,'#edf2fa',9)}${text(543,219,'CSV  →  Làm sạch  →  Đặc trưng',23,'#5f7aa4',700)}${line(541,482,1090,482,'#b6c3d8',2)}${line(541,482,541,255,'#b6c3d8',2)}${dots}${text(572,520,'Phân lớp',18,'#6683b4',700)}${text(761,520,'Luật kết hợp',18,'#a87965',700)}${text(965,520,'Gom cụm',18,'#61918d',700)}`);
 }
 case 'testing':
  return window('Quality board · Kiểm thử phần mềm',`${text(514,205,'TEST CASE',17,'#a36e68',700)}${text(846,205,'KẾT QUẢ',17,'#a36e68',700)}${['Đăng nhập hợp lệ','Mật khẩu để trống','Phân quyền API','Thanh toán trùng'].map((s,i)=>`${rect(505,225+i*61,588,48,i===2?'#fbe7e5':'#f7f6f3',7)}${text(523,256+i*61,s,21,'#64525a')}${rect(926,235+i*61,141,28,i===2?'#e9b3ab':'#d9e9df',14)}${text(954,255+i*61,i===2?'BUG':'PASS',17,i===2?'#9f493d':'#4d7a5b',700)}`).join('')}${text(514,509,'Tái hiện → Báo lỗi → Retest → Regression',17,'#9c786f')}`,'#be796f');
 case 'techniques':
  return window('C++ · Lập trình có kiểm thử',`${rect(500,184,590,213,'#243b56',10)}${text(520,221,'long long tinhTong(vector<int> a) {',21,'#b9cee8')}${text(542,262,'long long s = 0;',21,'#d4b48c')}${text(542,303,'for (int x : a) s += x;',21,'#adc9ba')}${text(542,344,'return s;',21,'#c7b9de')}${text(520,380,'}',21,'#b9cee8')}${['Dữ liệu thường','Trường hợp biên'].map((s,i)=>`${rect(508+i*296,424,280,71,'#eef2f8',10)}${text(525+i*296,465,s,20,'#536d92',700)}${check(746+i*296,450,'#77a28e')}`).join('')}`,'#6b86b1')+pill(920,575,'C++17',accent);
 case 'opensource':
  return window('PHP · Ứng dụng web mã nguồn mở',`${rect(501,183,587,121,'#eeeaf8',10)}${text(519,221,'<?php',25,'#7b64a7',700)}${text(539,261,'$products = $repository->findAll();',20,'#6d628a')}${['Model','View','Controller'].map((s,i)=>`${rect(508+i*196,347,181,104,['#e1dcef','#e5eef4','#e3eee4'][i],13)}${text(532+i*196,405,s,23,['#766197','#52758d','#628465'][i],700)}`).join('')}${text(521,505,'Form · Session · Truy vấn tham số',20,'#85749c')}`,'#8370ad')+pill(930,575,'PHP · MVC',accent);
 case 'python':
  return window('Python · Từ dòng lệnh đến hàm',`${rect(502,181,585,226,'#263b4b',10)}${text(522,219,'def tinh_tong(ds):',26,'#e8c767',700)}${text(548,260,'return sum(ds)',24,'#c3d5df')}${text(522,312,'diem = [7, 8, 9]',24,'#9dc0d7')}${text(522,358,'print(tinh_tong(diem))',24,'#c3d5df')}${rect(508,428,576,77,'#fff5d9',9)}${text(529,475,'>>> 24',29,'#967f42',700)}${text(829,475,'List  ·  Hàm  ·  Kết quả',18,'#99875a')}`,'#4f839f')+pill(916,575,'Python 3','#a5863c');
 case 'bigdata':
  return shadow(`${rect(493,111,637,445,'#f9fdfb',24)}${text(523,158,'DỮ LIỆU LỚN · TỪ NGUỒN ĐẾN KẾT QUẢ',18,'#527e72',700)}${[0,1,2].map(i=>`${rect(531,220+i*60,119,43,['#b8d8cc','#bdd8df','#d6d4b5'][i],6)}${text(547,249+i*60,['CSV','JSON','LOG'][i],18,'#56796e',700)}`).join('')}${line(660,300,719,300,'#8cafa3',6)}${rect(727,225,180,148,'#78ad9b',18)}${text(751,277,'HADOOP',23,'#fff',700)}${text(763,323,'SPARK',25,'#fff',700)}${line(918,300,960,300,'#8cafa3',6)}${rect(970,226,117,148,'#e3ede7',12)}${[48,81,112].map((h,i)=>rect(985+i*29,350-h,18,h,['#a0c2b4','#668e88','#c5b17f'][i],3)).join('')}${text(542,461,'Volume',22,'#6a9285',700)}${text(750,461,'Velocity',22,'#6a9285',700)}${text(958,461,'Variety',22,'#6a9285',700)}${line(533,490,1081,490,'#b6d1c5',3)}`);
 case 'aiLab': {
  const pts=[[805,202],[655,309],[973,309],[565,433],[735,433],[910,433],[1060,433]];
  return shadow(`${rect(494,106,633,449,'#fffef9',24)}${text(526,153,'TÌM ĐƯỜNG · LỰA CHỌN · SUY DIỄN',18,'#72895a',700)}${[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]].map(([a,b])=>line(...pts[a],...pts[b],a===0&&b===1||a===1&&b===4?'#80a15e':'#d3ddc4',a===0&&b===1||a===1&&b===4?7:4)).join('')}${pts.map(([x,y],i)=>node(x,y,['S','A','B','C','G','D','E'][i],i===4?'#83a65e':i<2?'#9db77e':'#dce6cc',i<2||i===4?'#fff':'#799263',27)).join('')}${text(531,512,'BFS · UCS · A* · Minimax',24,'#78915e',700)}`);
 }
 case 'digital':
  return shadow(`${rect(492,130,636,412,'#f5fbf8',25)}${rect(522,164,255,60,'#d9ebe3',10)}${text(543,202,'HỒ SƠ NHÓM',21,'#4f7d6c',700)}${['Báo cáo.docx','Ngân sách.xlsx','Bản nộp.pdf'].map((s,i)=>`${rect(521,251+i*67,346,49,'#edf4ef',8)}${text(539,283+i*67,s,20,'#527b69')}`).join('')}<path d="M970 203l100 39v85q0 89-100 135-100-46-100-135v-85Z" fill="#7fb39c" stroke="#e3f2e9" stroke-width="9"/>${check(943,304,'#fff')}${text(893,500,'Chia sẻ đúng quyền',20,'#4c806b',700)}`);
 case 'literacy':
  return shadow(`${rect(493,116,637,438,'#fcfdff',24)}${rect(523,155,575,60,'#edf0fa',30)}<circle cx="552" cy="184" r="11" fill="none" stroke="#8d9dc9" stroke-width="3"/>${line(560,193,571,204,'#8d9dc9',3)}${text(594,194,'Tìm thông tin có căn cứ',22,'#8190ba')}${['Ai là tác giả?','Nguồn gốc ở đâu?','Bằng chứng nào?'].map((s,i)=>`${rect(523,246+i*78,575,59,'#f0f3fb',10)}${text(547,283+i*78,s,23,'#6a80b1',700)}${check(1045,269+i*78,'#87a4a2')}`).join('')}`);
 default:return '';
 }
}
export function createCatalogArtwork(course,logos={},measureText){
 const info=catalogCoverInfo(course);if(!info)return null;
 const {paper,ink,accent,lines,subtitle,category,kind}=info;
 const isOffice=['word','excel','powerpoint'].includes(kind),dark=['deep','digital','networkLab'].includes(kind);
 const y=isOffice?306:251;
 const maxLength=Math.max(...lines.map(l=>l.length));
 const size=measureText?Math.min(64,...lines.map(s=>390/measureText(s,1))):maxLength>20?44:maxLength>14?50:64;
 const label=lines.map((s,i)=>text(52,y+i*(size+13),s,size,ink,700)).join('');
 const graphic=isOffice?officeScene(info,logos):scene(info);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><defs><linearGradient id="paper"><stop stop-color="${paper}"/><stop offset="1" stop-color="${dark?'#273c49':'#fffaf4'}"/></linearGradient><filter id="shadow" x="-20%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="13" stdDeviation="14" flood-color="${dark?'#000':ink}" flood-opacity=".13"/></filter><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${accent}" opacity=".1"/></pattern></defs><rect width="1200" height="675" fill="url(#paper)"/><rect x="446" width="754" height="675" fill="url(#grid)"/><circle cx="1148" cy="105" r="260" fill="${accent}" opacity=".07"/><path d="M105 637Q478 570 1160 619" fill="none" stroke="${accent}" opacity=".11" stroke-width="2"/>${text(52,51,'VEDU  /  HỌC & THỰC HÀNH',18,ink,700,'letter-spacing="2"')}${!isOffice?text(54,157,category,16,accent,700,'letter-spacing="2"'):''}${graphic}${label}${lines.length===1?text(54,y+70,'Hiểu nền tảng. Tự tay thực hiện.',24,accent,500):''}${text(54,isOffice?467:470,subtitle.split(' · ').slice(0,2).join(' · '),21,ink,500)}${text(54,505,subtitle.split(' · ').slice(2).join(' · '),21,ink,500)}${line(54,548,135,548,accent,5)}${text(54,591,isOffice?category:'KIẾN THỨC · BÀI TẬP · ỨNG DỤNG',15,accent,700,'letter-spacing="1.2"')}</svg>`;
}
