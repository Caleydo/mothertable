/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import AVectorFilter from './AVectorFilter';
import {ICategoricalVector} from 'phovea_core/src/vector';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';
import any = jasmine.any;
import color = d3.color;

export default class CategoricalFilter extends AVectorFilter<string, ICategoricalVector> {
  readonly node: HTMLElement;
  private _filterDim: {width: number, height: number} = {width: 200, height: 35};


  constructor(data: ICategoricalVector, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);
  }

  protected build(parent: HTMLElement) {
    const node = super.build(parent);
    // node.innerHTML = `<button>${this.data.desc.name}</button>`;
    // (<HTMLElement>node.querySelector('button')).addEventListener('click', () => {
    //   this.triggerFilterChanged();
    // });

    this.generateLabel(node);
    this.generateCategories(node);

    return node;
  }


  private generateLabel(node) {

    const labelNode = d3.select(node).append('div').classed('filterlabel', true);
    labelNode.text(`Label: ${this.data.desc.name}`);
  }

  private async generateCategories(node) {

    console.log(this._filterDim)
    const allCatNames = await(<any>this.data).data();
    const categories = (<any>this.data).desc.value.categories;
    const c20 = d3.scale.category20();
    const catData = [];
    const uniqueValues = allCatNames.filter((x, i, a) => a.indexOf(x) === i);
    uniqueValues.forEach(((val, i) => {
      const count = allCatNames.filter(isSame.bind(this, val));
      let colcat;
      if (typeof categories !== 'undefined') {
        colcat = categories.filter((d, i) => d.name === val);

      }
      const colorVal = (colcat.length < 1) ? c20(count.length) : colcat[0].color;
      catData.push({name: val, count: count.length, 'color': colorVal});
    }));

    const catEntries = d3.select(node).append('div').classed('catentries', true)
      .style('display', 'flex')
      .style('align-items', 'flex-end');
    const binScale = d3.scale.linear()
      .domain(d3.extent(catData, (d) => d.count)).range([this._filterDim.height / 2, this._filterDim.height]);
    const catListDiv = catEntries
      .selectAll('div.categories')
      .data(catData).enter();
    const cellDimension = this._filterDim.width / catData.length;
    catListDiv.append('div')
      .attr('class', 'categories')
      .style('flex-grow', 1)
      .style('height', (d, i) => binScale(d.count) + 'px')
      .style('background-color', (d) => d.color)
      .text((d: any) => {
        return d.name;
      })
      .on('click', function (d, i) {

        console.log(d);

      });


  }


  async filter(current: Range1D) {
    // TODO
    return current;
  }
}


function isSame(value, compareWith) {


  return value === compareWith;
}
