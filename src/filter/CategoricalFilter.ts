/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import AVectorFilter from './AVectorFilter';
import {ICategoricalVector} from 'phovea_core/src/vector';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';
import any = jasmine.any;
import color = d3.color;
import day = d3.time.day;

export default class CategoricalFilter extends AVectorFilter<string, ICategoricalVector> {
  readonly node: HTMLElement;
  private _filterDim: {width: number, height: number};


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
    const dispHistogram = true;
    this.generateCategories(node, dispHistogram);

    return node;
  }


  get filterDim(): {width: number; height: number} {
    this._filterDim = {width: 205, height: 35};
    return this._filterDim;
  }

  set filterDim(value: {width: number; height: number}) {
    this._filterDim = value;
  }


  private generateLabel(node) {

    const labelNode = d3.select(node).append('div').classed('filterlabel', true);
    labelNode.text(`Label: ${this.data.desc.name}`);
  }

  private generateTooltip(node) {
    const tooltipDiv = d3.select(node).append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);
    return tooltipDiv;
  }


  private async generateCategories(node, dispHistogram) {

    const cellHeight = this.filterDim.height;
    const cellWidth = this.filterDim.width;
    const allCatNames = await(<any>this.data).data();
    const categories = (<any>this.data).desc.value.categories;
    const c20 = d3.scale.category20();
    const myData = this.data;
    const toolTip = (this.generateTooltip(node));

    const catData = [];
    const uniqueCategories = allCatNames.filter((x, i, a) => a.indexOf(x) === i);
    uniqueCategories.forEach(((val, i) => {
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

    let activeCategories = catData;


    const catListDiv = catEntries
      .selectAll('div.categories')
      .data(catData).enter();

    catListDiv.append('div')
      .attr('class', 'categories')
      .style('flex-grow', 1)
      .style('height', (d, i) => (dispHistogram === true) ? binScale(d.count) + 'px' : cellHeight + 'px')
      .style('width', '100%')
      //.style('height', (d, i) => binScale(d.count) + 'px')
      .style('background-color', (d) => d.color)
      .text((d: any) => {
        return d.name;
      })
      .on('mouseover', function (d, i) {
        toolTip.transition()
          .duration(200)
          .style('opacity', 1);
        toolTip.html(`${d.count}`)
          .style('left', ((<any>d3).event.pageX) + 'px')
          .style('top', ((<any>d3).event.pageY - 10) + 'px');
      })
      .on('mouseout', function (d) {
        toolTip.transition()
          .duration(500)
          .style('opacity', 0);
      })
      .on('click', function (d, i) {
        d3.select(this).classed('active', !d3.select(this).classed('active'));
        if (d3.select(this).classed('active') === false) {
          const cat = activeCategories;
          cat.push(d);
          activeCategories = cat;

          onClickCatA(myData, cat);

        } else if (d3.select(this).classed('active') === true) {
          let ind = -1;
          const cat = activeCategories;
          for (let i = 0; i < cat.length; ++i) {
            if (cat[i].name === d.name) {
              ind = i;
            }
          }
          cat.splice(ind, 1);
          activeCategories = cat;
          onClickCatA(myData, cat);

        }
      });


  }


  async filter(current: Range1D) {

    return current;
  }
}


async function onClickCatA(data, filterType?) {
  const vectorView = await (<any>data).filter(findCatName.bind(this, filterType));
  const filteredRange = await vectorView.ids();
  console.log((<any>filteredRange).dim(0).asList());

}

function isSame(value, compareWith) {


  return value === compareWith;
}


function findCatName(catName: any[], value, index,) {

  for (const x in catName) {
    if (catName[x].name === value) {
      console.log(value, catName[x].name)
      return value;
    }
  }
  return;


}
