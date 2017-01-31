/**
 * Created by bikramkawan on 21/01/2017.
 */

import {create as createMultiForm, addIconVisChooser} from 'phovea_core/src/multiform';
import App from './app';
import {MultiForm} from 'phovea_core/src/multiform';
import {createNode} from 'phovea_core/src/multiform/internal';
import {IMultiForm} from 'phovea_core/src/multiform';
import {choose} from 'phovea_ui/src/dialogs';
import Block from './Block';
import {makeSort} from './SortManager';
import FilterManager from './FilterManager';
import * as d3 from 'd3';

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
    const vectorOrMatrix = (<any>filteredVisData.desc).type;
    let initialVis;
    if (vectorOrMatrix === 'vector') {
      const dataType = (<any>filteredVisData.desc).value.type;
      if (dataType === 'categorical' || dataType === 'int' || dataType === 'real') {
        initialVis = 'phovea-vis-heatmap1d';
      }

    } else if (vectorOrMatrix === 'matrix') {

      initialVis = 'phovea-vis-heatmap';
    }

    const vis = createMultiForm(filteredVisData, <HTMLElement>parent.select('main').node(), {'initialVis': initialVis});
    const block: Block = new Block(visData, filteredVisData, visUID, vis, parent);
    App.blockList.set(block.uid, block);
    this.addIconVisChooser(visUID, <HTMLElement>parent.select('header').node(), vis);


    /*  this.visData.push(visData);
     this.visUID.push(visUID);
     this.blocks.push(vis);
     this.blockDivs.push(parent);*/

  }


  private addIconVisChooser(visUID, toolbar: HTMLElement, ...forms: IMultiForm[]) {
    const s = toolbar.ownerDocument.createElement('div');
    toolbar.insertBefore(s, toolbar.firstChild);
    const visses = this.toAvailableVisses(forms);
    const multiforms: MultiForm[] = [];
    const divs: HTMLDivElement[] = [];
    App.blockList.forEach((block) => {
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

    const childSort = s.ownerDocument.createElement('label');
    childSort.className = 'adder fa fa-sort-amount-desc fa-0.5x';
    childSort.style.cursor = 'pointer';
    s.appendChild(childSort);

    const block = (App.blockList.get(visUID));
    const columnType = (<any> block.data).desc.value.type;
    const sortList = getSortList(columnType);
    //add icon for dragging
    const child = s.ownerDocument.createElement('label');
    child.className = 'adder fa fa-arrows fa-0.8x';
    child.style.cursor = 'move';
    s.appendChild(child);
    child.onclick = () => console.log('You clicked on Dragging icon.');

    childSort.onclick = () => choose(sortList.map((d) => d), 'Choose sorting criteria').then((selection) => {
      const div: HTMLDivElement = <HTMLDivElement>childSort.parentElement.parentElement.parentElement;
      const multiform = div.childNodes[1].childNodes[0];
      const sort = makeSort(visUID, selection);
      return selection;
    });


    const childCloseMe = s.ownerDocument.createElement('label');
    childCloseMe.className = 'adder fa fa-close fa-0.8x';
    childCloseMe.style.cursor = 'pointer';
    s.appendChild(childCloseMe);
    childCloseMe.onclick = () => {

      childCloseMe.parentElement.parentElement.parentElement.remove();
      const nodes: HTMLElement[] = this._filterManager.filterDiv[0][0].children;

      // for (let index = 0; index < nodes.length; ++index) {
      //
      //   if (nodes[index].getAttribute('f-uid') === visUID) {
      //     nodes[index].remove();
      //     App.blockList.delete(visUID);
      //   }
      //
      // }


      for (const n of nodes) {

        FilterManager.filterListOrder.forEach(function (d, i) {

          if (d === visUID) {
            const previousFID = FilterManager.filterListOrder[i - 1];
            const previousDiv = d3.select(`[f-uid="${previousFID}"]`);
            previousDiv.selectAll('.lineConnection').remove();
          }
        });

        if (n.getAttribute('f-uid') === visUID) {
          n.remove();
          App.blockList.delete(visUID);
        }
      }
    };

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


function getSortList(type) {

  if (type === 'string') {
    return ['alphabetical'];
  } else if (type === 'int' || type === 'real') {
    return ['min', 'max'];
  } else if (type === 'categorical') {
    return ['count'];
  }


}
