#!/usr/bin/env python3
import csv,json,re
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def norm(s): return re.sub(r'[、。,.!?！？「」『』（）()［］\[\]【】・/／\\\s]','',str(s).lower().replace('　',' '))
def read_common():
 rows=[]
 for r in csv.DictReader(open(ROOT/'data/common_dictionary.csv',encoding='utf-8')):
  terms=[r['word']]+[x for x in r['synonym'].split('|') if x]
  rows.append({'terms':[norm(x) for x in terms],'tag':r['tag'],'weight':int(r['weight'])})
 return rows
def read_prog():
 d={}
 for r in csv.DictReader(open(ROOT/'data/program_dictionary.csv',encoding='utf-8')):
  terms=[r['word']]+[x for x in r['synonym'].split('|') if x]
  r['terms']=[norm(x) for x in terms]; r['weight']=int(r['weight'])
  d.setdefault(r['program_id'],[]).append(r)
 return d
def analyze(text,common):
 n=norm(text); c=Counter()
 for e in common:
  if any(t and t in n for t in e['terms']): c[e['tag']]+=e['weight']
 return c
def score(text,tags,programs,pd):
 n=norm(text); out=[]
 for p in programs:
  s=0; m=Counter()
  for e in pd.get(p['id'],[]):
   if any(t and t in n for t in e['terms']): s+=e['weight']*2; m[e['word']]+=e['weight']*2
   elif any(t in tags for t in [e['word']]+e.get('synonym','').split('|')): s+=e['weight']; m[e['word']]+=e['weight']
  for t,w in tags.items():
   if t in p['tags'] or t in p['areas']: s+=max(.25,w*.2); m[t]+=w*.2
  if s: out.append((s,p,m))
 return sorted(out,key=lambda x:-x[0])[:8]
def main():
 common=read_common(); pd=read_prog(); programs=json.load(open(ROOT/'data/programs.json',encoding='utf-8'))
 rows=list(csv.DictReader(open(ROOT/'docs/seed_questions.csv',encoding='utf-8')))
 hit=0; top=Counter(); no=[]
 for r in rows:
  tags=analyze(r['sample_input'],common); sc=score(r['sample_input'],tags,programs,pd)
  if sc:
   hit+=1
   for _,p,_ in sc[:3]: top[p['department']]+=1
  elif len(no)<10: no.append(r['sample_input'])
 print('questions',len(rows)); print('programs',len(programs)); print('hit_rate',round(hit/len(rows),3)); print('top30')
 for k,v in top.most_common(30): print(k,v)
 if no: print('no_hit',no)
if __name__=='__main__': main()
