const fs=require('node:fs'); const cp=require('node:child_process');
const QR=require('qrcode'); const jsqr=require('./qr-verifier/node_modules/jsqr');
const payload=cp.execFileSync('docker',['exec','domestic-service-postgres-1','psql','-X','-U','domestic_admin','-d','finance_db','-Atc','SELECT qr_content FROM staff_topups WHERE receiving_account_verified AND qr_content IS NOT NULL ORDER BY id DESC LIMIT 1'],{encoding:'utf8'}).trim();
if(!payload)throw Error('No persisted provider QR to verify');
const {modules}=QR.create(payload,{errorCorrectionLevel:'M'});const unit=6, extent=modules.size+8,width=extent*unit;
const pixels=new Uint8ClampedArray(width*width*4).fill(255);let count=0;
// Same horizontal-run path construction as PaymentQr; rasterize each run and decode it independently.
for(let y=0;y<modules.size;y++) for(let x=0;x<modules.size;x++) {if(!modules.get(y,x))continue;const start=x;while(x+1<modules.size&&modules.get(y,x+1))x++;const path=`M${start+4} ${y+4}h${x-start+1}v1H${start+4}z`;const [xx,yy,len]=path.match(/M(\d+) (\d+)h(\d+)/).slice(1).map(Number);for(let py=yy*unit;py<(yy+1)*unit;py++)for(let px=xx*unit;px<(xx+len)*unit;px++){const index=(py*width+px)*4;pixels[index]=pixels[index+1]=pixels[index+2]=0;}count++;}
const decoded=jsqr(pixels,width,width);if(decoded?.data!==payload)throw Error('Decoded QR does not match persisted provider data');
console.log('PASS: QR renderer path round-trip decodes to exact persisted payOS payload; '+count+' horizontal runs.');
