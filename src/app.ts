/**
 * Created by Caleydo Team on 31.08.2016.
 */

import * as d3 from 'd3';
import {IDataType} from 'phovea_core/src/datatype';
import {list as listData, convertTableToVectors} from 'phovea_core/src/data';
import {choose} from 'phovea_ui/src/dialogs';
import {create as createMultiForm} from 'phovea_core/src/multiform';
import {MultiForm} from 'phovea_core/src/multiform';
import {createNode} from 'phovea_core/src/multiform/internal';
import {IMultiForm} from 'phovea_core/src/multiform';



/**
 * The main class for the App app
 */
export class App {

  private readonly $node;

  private blocks:MultiForm[]=[];
  private blockDivs:HTMLDivElement[]=[];

  constructor(parent:Element) {
    this.$node = d3.select(parent);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<App>}
   */
  init() {
    return this.build();
  }

  /**
   * Load and initialize all necessary views
   * @returns {Promise<App>}
   */
  private build() {
    this.setBusy(true);
    return listData().then((datasets) => {
      datasets = convertTableToVectors(datasets);
      this.$node.select('h3').remove();
      this.$node.select('button.adder').on('click', () => {
        choose(datasets.map((d)=>d.desc.name), 'Choose dataset').then((selection) => {
          this.addDataset(datasets.find((d) => d.desc.name === selection));
        });
      });
      this.setBusy(false);
    });
  }

  private addDataset(data: IDataType) {
    const parent = this.$node.select('main').append('div').classed('block', true).html(`<header class="toolbar"></header><main></main>`);

    const vis = createMultiForm(data, <HTMLElement>parent.select('main').node(), {});
   // vis.addIconVisChooser(<HTMLElement>parent.select('header').node());
    this.addIconVisChooser(<HTMLElement>parent.select('header').node(),vis);
    this.blocks.push(vis);
    this.blockDivs.push(parent);
      vis.transform([1,1]);
     //if(parent[0][0].childNodes[1].childNodes[0].childNodes[0].childNodes[0] instanceof svg) {
       let svg: SVGElement = parent[0][0].childNodes[1].childNodes[0].childNodes[0].childNodes[0];
       let visHeight = svg.clientHeight;
       let visWidth = svg.clientWidth;
       parent[0][0].setAttribute("style", "height:210px; width:200px");
       svg.setAttribute("viewbox", "0 0 200 200");
       svg.setAttribute("height", "200");
       svg.setAttribute("width", "200");
       vis.transform([200 / visWidth, 200 / visHeight]);
   //  }


  }

  /**
   * Show or hide the application loading indicator
   * @param isBusy
   */
  setBusy(isBusy) {
    this.$node.select('.busy').classed('hidden', !isBusy);
  }

  private addIconVisChooser(toolbar: HTMLElement, ...forms: IMultiForm[]) {
  const s = toolbar.ownerDocument.createElement('div');
  toolbar.insertBefore(s, toolbar.firstChild);
  const visses = this.toAvailableVisses(forms);

  visses.forEach((v) => {
    let child = createNode(s, 'i');
    v.iconify(child);
    child.onclick = () => forms.forEach((f) => {
        f.switchTo(v).then(()=>
           this.blockDivs.forEach((b,index)=>{
              this.blocks[index].transform([1,1]);
              let svg = b[0][0].childNodes[1].childNodes[0].childNodes[0].childNodes[0];
              let visHeight = svg.clientHeight;
              let visWidth = svg.clientWidth;
              b[0][0].setAttribute("style","height:210px; width:200px");
             svg.setAttribute("viewbox","0 0 200 200");
             svg.setAttribute("height","200");
             svg.setAttribute("width","200");
              this.blocks[index].transform([200/visWidth,200/visHeight]);
           })
        );

    }) ;
  });
  var child = s.ownerDocument.createElement("label");
  child.className = "adder fa fa-sort-amount-desc fa-0.5x";
    child.style.cursor = "pointer";
  s.appendChild(child);
  //child.onclick  = () => child.parentElement.parentElement.parentElement.remove();



  var child = s.ownerDocument.createElement("label");
  child.className = "adder fa fa-close fa-0.8x";
    child.style.cursor = "pointer";
  s.appendChild(child);
  child.onclick  = () => child.parentElement.parentElement.parentElement.remove();



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



/**
 * Factory method to create a new app instance
 * @param parent
 * @returns {App}
 */
export function create(parent:Element) {
  return new App(parent);
}
