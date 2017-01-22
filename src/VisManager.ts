/**
 * Created by bikramkawan on 21/01/2017.
 */

import {create as createMultiForm, addIconVisChooser} from 'phovea_core/src/multiform';
import App from './app';
import {MultiForm} from 'phovea_core/src/multiform';
import FilterManager from './FilterManager';
import {createNode} from 'phovea_core/src/multiform/internal';
import {IMultiForm} from 'phovea_core/src/multiform';
import {choose} from 'phovea_ui/src/dialogs';
import Block from './Block'

export default class VisManager {

  //private _visData;
  //private _visUID;
  private _parentDiv = App.visNode;
  private _filterManager;
  private blocks: Block[] = [];

 // private visUID = [];
 // private visData = [];
 // private blocks: MultiForm[] = [];
 // private blockDivs: HTMLDivElement[] = [];


  constructor() {
 //   this._visData = visData;
 //   this._visUID = visUID;
  }

/*  get visData() {
    return this._visData;
  }

  set visData(value) {
    this._visData = value;
  }

  get visUID() {
    return this._visUID;
  }

  set visUID(value) {
    this._visUID = value;
  }*/

  get parentDiv() {
    return this._parentDiv;
  }

  set parentDiv(value) {
    this._parentDiv = value;
  }

  set filterManager(value) {
    this._filterManager = value;
  }

  createVis(visData, filteredVisData, visUID) {
    const parent = this._parentDiv
      .append('div')
      .attr('data-uid', visUID)
      // .call(drag)
      .html(`<header class="toolbar"></header><main class="vis"></main>`);
    const vis = createMultiForm(filteredVisData, <HTMLElement>parent.select('main').node());
    var block:Block = new Block(visData,filteredVisData, visUID, vis,parent);
    App.blockList.set(block.uid, block);
    this.addIconVisChooser(visUID,<HTMLElement>parent.select('header').node(), vis);


  /*  this.visData.push(visData);
    this.visUID.push(visUID);
    this.blocks.push(vis);
    this.blockDivs.push(parent);*/

  }


  private addIconVisChooser(visUID,toolbar: HTMLElement, ...forms: IMultiForm[]) {
    const s = toolbar.ownerDocument.createElement('div');
    toolbar.insertBefore(s, toolbar.firstChild);
    const visses = this.toAvailableVisses(forms);
    var multiforms: MultiForm[] = [];
    var divs: HTMLDivElement[] = [];
    App.blockList.forEach((block)=>{
      multiforms.push(block.multiform);
      divs.push(block.blockDiv);
    });


    visses.forEach((v) => {
      const child = createNode(s, 'i');
      v.iconify(child);
      child.onclick = () => forms.forEach((f) => {
        f.switchTo(v).then(() =>
          divs.forEach((b, index) => {
            multiforms[index].transform([1, 1]);
            const svg = b[0][0].childNodes[1].childNodes[0].childNodes[0].childNodes[0];
            const visHeight = svg.clientHeight;
            const visWidth = svg.clientWidth;
            b[0][0].setAttribute('style', 'height:210px; width:200px');
            svg.setAttribute('viewbox', '0 0 200 200');
            svg.setAttribute('height', '200');
            svg.setAttribute('width', '200');
            multiforms[index].transform([200 / visWidth, 200 / visHeight]);
          })
        );

      });
    });
    var child = s.ownerDocument.createElement('label');
    child.className = 'adder fa fa-sort-amount-desc fa-0.5x';
    child.style.cursor = 'pointer';
    s.appendChild(child);
    const sort = ['min', 'max', 'median', 'q1', 'q3'];

    child.onclick = () => choose(sort.map((d) => d), 'Choose sorting criteria').then((selection) => {
      const div: HTMLDivElement = <HTMLDivElement>child.parentElement.parentElement.parentElement;
      const multiform = div.childNodes[1].childNodes[0];

      return selection;
    });


    var child = s.ownerDocument.createElement('label');
    child.className = 'adder fa fa-close fa-0.8x';
    child.style.cursor = 'pointer';
    s.appendChild(child);
    child.onclick = () => {
      child.parentElement.parentElement.parentElement.remove();
      var nodes: HTMLElement[] = this._filterManager.filterDiv[0][0].children;
      for (var index = 0; index < nodes.length; ++index) {
         if(nodes[index].getAttribute('f-uid') == visUID){
            nodes[index].remove();
         }

      }




    }


  }

  private toAvailableVisses(forms: IMultiForm[]) {
    if (forms.length === 0) {
      return [];
    }
    if (forms.length === 1) {
      return forms[0].visses;
    }
    //intersection of all
    return forms[0].visses.filter((vis) => forms.every((f) => f.visses.indexOf(vis) >= 0));
  }


}
