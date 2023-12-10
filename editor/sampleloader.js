/* 
 * Copyright 2023 nigjo.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {StructoEdit} from "./structoedit.js";
(()=>{
  let filename=document.getElementById('samplesource')?.href;
  if(!filename){
    //fallback directly to "fallbacksample"
    document.addEventListener('DOMContentLoaded',()=>{
      console.debug("INDEX", "init page");
      let sourceid = document.querySelector('[data-structcode-id]')?.dataset.structcodeId;
      let fallback = document.getElementById('fallbacksample').content.querySelector("pre");
      document.getElementById(sourceid).textContent = fallback.textContent;
      var view=document.querySelector(".structview[data-structcode-id='"+sourceid+"']");
      StructoEdit.updateView(view);
    });
    return;
  }
  console.debug("INDEX", "init content");
  Promise.all([
    fetch(filename).then(r=>{
      if(r.ok){
        return r.text();
      }
      throw r;
    }),
    new Promise(ok=>{
      if(document.readyState!=='loading'){
        let sourceid = document.querySelector('.structview[data-structcode-id]')?.dataset.structcodeId;
        ok(sourceid);
      }else{
        document.addEventListener('readystatechange',()=>{
          if(document.readyState==='interactive'){
            //select the first view
            let sourceid = document.querySelector('.structview[data-structcode-id]')?.dataset.structcodeId;
            ok(sourceid);
          }
        });
      }
    })
  ])
  .then(args=>{
    console.debug("INDEX", "loaded");
    document.getElementById(args[1]).textContent = args[0];
    var view=document.querySelector(".structview[data-structcode-id='"+args[1]+"']");
    StructoEdit.updateView(view);
  }).catch(e=>{
    console.group("INDEX","LOAD FAILED");
    console.warn(e);
    //select the first view
    let sourceid = document.querySelector('.structview[data-structcode-id]')?.dataset.structcodeId;
    if(sourceid){
      if(e instanceof Response){
        document.getElementById(sourceid).textContent =
                e.status+': '+e.statusText;
      }else{
        let fallback = document.getElementById('fallbacksample').content.querySelector("pre");
        document.getElementById(sourceid).textContent = fallback.textContent;
      }
      var view=document.querySelector(".structview[data-structcode-id='"+sourceid+"']");
      StructoEdit.updateView(view);
    }
    console.groupEnd();
  });
})();
