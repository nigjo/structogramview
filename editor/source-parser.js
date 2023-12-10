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

export class SourceParser {
  
  constructor(){
    if(this.constructor==='SourceImporter'){
      throw new Error('SourceImporter is an abstract class');
    }
  }
  /**
   * 
   * @param {SourceParser} sourceImporter
   * @returns {undefined}
   */
  static register(sourceImporter){
    console.log("SourceParser", "registered", sourceImporter.constructor?sourceImporter.constructor.name:"a parser");
    SourceParser.knownImporter = sourceImporter;
  }
  static createParser(){
    if(!SourceParser.knownImporter){
      console.warn("SourceParser", "no source parser registered");
      return null;
    }
    return SourceParser.knownImporter;
  }
  getFileType(){
    return "*";
  }
  getDescription(){
    return "All files";
  }
  parseSourceContent(fileContent) {
    throw new Error("no implementation, yet");
  }
  queryDiagramNames() {
    throw new Error("no implementation, yet");
  }
  getDiagram(diagramName) {
    throw new Error("no implementation, yet");
  }
}

export function SourceParseException(linenum, line, error){
  this.linenum=linenum;
  this.line = line;
  this.contextError = error?error.toString():'unknown';
  this.toString = function() {
    return "Error in line " + linenum + ": '"+line+"', " + this.contextError;
  };
}

