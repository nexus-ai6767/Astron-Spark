'use strict';
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'private-data');
const PRODUCT_ZIP = process.env.PRODUCT_ZIP || path.join(DATA_DIR, 'astron-pro-windows.zip');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SITE_ORIGIN = process.env.SITE_ORIGIN || '';
if (!ADMIN_TOKEN || ADMIN_TOKEN.length < 24) { console.error('Set ADMIN_TOKEN to a random secret of at least 24 characters.'); process.exit(1); }
fs.mkdirSync(DATA_DIR, {recursive:true});
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]', {mode:0o600});
app.disable('x-powered-by'); app.use(helmet()); app.use(express.json({limit:'12kb'}));
app.use('/api/', rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:true,legacyHeaders:false}));
function load(){try{return JSON.parse(fs.readFileSync(ORDERS_FILE,'utf8'));}catch{throw new Error('Order storage is unavailable');}}
function save(orders){const tmp=ORDERS_FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(orders,null,2),{mode:0o600});fs.renameSync(tmp,ORDERS_FILE);}
function clean(s,n=254){return typeof s==='string'?s.trim().slice(0,n):'';}
function validEmail(s){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}
function admin(req,res,next){const got=req.get('x-admin-token')||'';if(!crypto.timingSafeEqual(Buffer.from(got.padEnd(ADMIN_TOKEN.length,'\0').slice(0,ADMIN_TOKEN.length)),Buffer.from(ADMIN_TOKEN))||got.length!==ADMIN_TOKEN.length)return res.status(401).json({error:'Admin authentication failed'});next();}
app.post('/api/assistant', async (req,res)=>{
 const question=clean(req.body && req.body.question,500);
 if(!question || question.length<2)return res.status(400).json({error:'Please enter a question.'});
 const system='You are the ASTRON website guide. Answer visitor questions using only these verified website facts: ASTRON is presented as a cinematic personal AI system focused on voice, vision, automation, memory and local intelligence, designed to run on the user’s machine. Feature availability depends on build/configuration. For current prices, tell users to check the website pricing cards; never invent prices. For installation requirements, direct users to the relevant product documentation. Do not invent guarantees, capabilities, policies, contact details or product claims. Be concise, friendly and transparent when information is unknown.';
 const key=process.env.AI_API_KEY;
 if(!key){
  const q=question.toLowerCase(); let answer='I do not have a verified answer to that specific question in the published website information yet. I can explain ASTRON’s listed features, getting started, or published pricing. The site owner can enable more flexible answers by configuring the secure AI backend.';
  if(/what is astron|about astron|what does astron do/.test(q))answer='ASTRON is presented on this website as a cinematic personal AI system focused on voice, vision, automation, memory and local intelligence, designed to run on your own machine.';
  else if(/feature|capabilit|what can it do|voice|vision|memory|automation/.test(q))answer='The website highlights voice assistance, vision tools, automation, memory and local AI. Exact capabilities depend on the specific ASTRON build and its configured components.';
  else if(/price|pricing|cost|free|₹|payment/.test(q))answer='Please check the pricing cards currently displayed on this website for the latest listed price and plan details. I will not guess prices or payment terms that may have changed.';
  else if(/get started|install|installation|download|how do i start/.test(q))answer='Use the Get Started buttons and follow the instructions on the relevant ASTRON page. Check the published requirements and choose the package that matches your device.';
  return res.json({answer,mode:'guide'});
 }
 try{
  const endpoint=(process.env.AI_API_URL||'https://api.openai.com/v1/chat/completions').replace(/\/$/,'');
  const model=process.env.AI_MODEL||'gpt-4o-mini';
  const upstream=await fetch(endpoint,{method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model,temperature:0.3,max_tokens:350,messages:[{role:'system',content:system},{role:'user',content:question}] }),signal:AbortSignal.timeout(12000)});
  const payload=await upstream.json().catch(()=>({}));
  if(!upstream.ok)throw new Error('AI provider returned '+upstream.status);
  const answer=payload.choices&&payload.choices[0]&&payload.choices[0].message&&payload.choices[0].message.content;
  if(typeof answer!=='string'||!answer.trim())throw new Error('AI provider returned no answer');
  return res.json({answer:answer.trim().slice(0,3000),mode:'ai'});
 }catch(err){console.error('ASTRON assistant provider error:',err.message);return res.status(503).json({error:'Live AI is temporarily unavailable. Please try again.'});}
});

app.post('/api/orders',(req,res)=>{
 const buyerName=clean(req.body.buyerName,100),email=clean(req.body.email).toLowerCase(),payerName=clean(req.body.payerName,100),utr=clean(req.body.utr,80).replace(/\s/g,'').toUpperCase();
 if(!buyerName||!validEmail(email)||! /^[A-Z0-9-]{8,80}$/.test(utr)||req.body.amountConfirmed!==true)return res.status(400).json({error:'Enter valid details and confirm that ₹950 was paid.'});
 const orders=load();if(orders.some(o=>o.utr===utr))return res.status(409).json({error:'That transaction reference has already been submitted.'});
 const order={orderId:crypto.randomBytes(9).toString('hex').toUpperCase(),buyerName,email,payerName,utr,amount:950,currency:'INR',status:'pending',createdAt:new Date().toISOString(),reviewedAt:null,downloadToken:null,downloadTokenExpiresAt:null};
 orders.push(order);save(orders);res.status(201).json({orderId:order.orderId,status:order.status});
});
app.post('/api/orders/status',(req,res)=>{
 const orderId=clean(req.body.orderId,40).toUpperCase(),email=clean(req.body.email).toLowerCase();const o=load().find(x=>x.orderId===orderId&&x.email===email);if(!o)return res.status(404).json({error:'Order not found. Check the order reference and email.'});
 if(o.status!=='approved')return res.json({status:o.status});
 if(!fs.existsSync(PRODUCT_ZIP))return res.status(503).json({error:'The product ZIP has not been installed on the server yet.'});
 const now=Date.now();let orders=load();let current=orders.find(x=>x.orderId===orderId);if(!current.downloadToken||!current.downloadTokenExpiresAt||Date.parse(current.downloadTokenExpiresAt)<now){current.downloadToken=crypto.randomBytes(32).toString('hex');current.downloadTokenExpiresAt=new Date(now+15*60*1000).toISOString();save(orders);}
 res.json({status:'approved',downloadUrl:'/api/download/'+current.downloadToken,expiresAt:current.downloadTokenExpiresAt});
});
app.get('/api/download/:token',(req,res)=>{
 const token=clean(req.params.token,100);if(!/^[a-f0-9]{64}$/.test(token))return res.status(404).send('Download link is invalid or expired.');
 const orders=load(),o=orders.find(x=>x.status==='approved'&&x.downloadToken===token&&x.downloadTokenExpiresAt&&Date.parse(x.downloadTokenExpiresAt)>Date.now());
 if(!o)return res.status(404).send('Download link is invalid or expired. Check your order status to request a fresh link.');
 if(!fs.existsSync(PRODUCT_ZIP))return res.status(503).send('Product ZIP is not configured on the server.');
 res.download(PRODUCT_ZIP,'Astro-Prime-Windows.zip',err=>{if(err&&!res.headersSent)res.status(500).end('Download failed.');});
});
app.get('/api/admin/orders',admin,(req,res)=>{res.json(load().map(({downloadToken,...o})=>o));});
app.post('/api/admin/orders/:id/approve',admin,(req,res)=>{
 if(!fs.existsSync(PRODUCT_ZIP))return res.status(503).json({error:'Install the private product ZIP before approving orders.'});
 const orders=load(),o=orders.find(x=>x.orderId===clean(req.params.id,40).toUpperCase());if(!o)return res.status(404).json({error:'Order not found.'});o.status='approved';o.reviewedAt=new Date().toISOString();o.downloadToken=null;o.downloadTokenExpiresAt=null;save(orders);res.json({orderId:o.orderId,status:o.status});
});
app.post('/api/admin/orders/:id/reject',admin,(req,res)=>{const orders=load(),o=orders.find(x=>x.orderId===clean(req.params.id,40).toUpperCase());if(!o)return res.status(404).json({error:'Order not found.'});o.status='rejected';o.reviewedAt=new Date().toISOString();o.downloadToken=null;o.downloadTokenExpiresAt=null;save(orders);res.json({orderId:o.orderId,status:o.status});});
app.get('/api/health',(req,res)=>res.json({ok:true}));
if(SITE_ORIGIN)app.use((req,res,next)=>{res.setHeader('Access-Control-Allow-Origin',SITE_ORIGIN);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type,X-Admin-Token');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');if(req.method==='OPTIONS')return res.sendStatus(204);next();});
app.listen(PORT,()=>console.log(`ASTRON payment service listening on ${PORT}`));
