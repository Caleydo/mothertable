/**
 * Created by Samuel Gratzl on 19.01.2017.
 */
import AVectorFilter from './AVectorFilter';
import {ICategoricalVector} from 'phovea_core/src/vector';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';

export default class CategoricalFilter extends AVectorFilter<string, ICategoricalVector> {
  readonly node: HTMLElement;
  private _filterDim: {width: number, height: number};
  private _activeCategories: string[];


  constructor(data: ICategoricalVector, parent: HTMLElement) {
    super(data);
    this.node = this.build(parent);

  }

  protected build(parent: HTMLElement) {
    const node = super.build(parent);
    // node.innerHTML = `<button>${this.data.desc.name}</button>`;
    // (<HTMLElement>node.querySelector('button')).addEventListener('click', () => {
    //
    //   this.triggerFilterChanged();
    // });


    this.generateLabel(node, this.data.desc.name);
    const dispHistogram: boolean = true;
    this.generateCategories(<HTMLElement>node.querySelector('main'), dispHistogram);

    return node;
  }


  get filterDim(): {width: number; height: number} {
    this._filterDim = {width: 205, height: 35};
    return this._filterDim;
  }

  set filterDim(value: {width: number; height: number}) {
    this._filterDim = value;
  }


  private async generateCategories(node: HTMLElement, dispHistogram: boolean) {
    const that = this;
    const cellHeight = this.filterDim.height;
    const allCatNames = await(<any>this.data).data();
    const categories = (<any>this.data).desc.value.categories;
    const c20 = d3.scale.category20();
    const toolTip = (this.generateTooltip(node));
    const cellDimension = this.filterDim.width / categories.length;
    const catData = [];
    const uniqueCategories = allCatNames.filter((x, i, a) => a.indexOf(x) === i);
    uniqueCategories.forEach(((val, i) => {
      const count = allCatNames.filter(isSame.bind(this, val));
      let colcat = [];
      if (typeof categories !== 'undefined') {
        colcat = categories.filter((d, i) => {
          return d.name === val;
        });
      }
      const colorVal = (colcat.length < 1) ? c20(count.length) : colcat[0].color;
      catData.push({name: val, count: count.length, 'color': colorVal});
    }));


    const binScale = d3.scale.linear()
      .domain([0, d3.max(catData, (d) => d.count)]).range([0, this._filterDim.height]);

    that._activeCategories = catData;

    // const catColor = d3.select(node).append('div').classed('colorDiv', true);
    // const catt = catColor
    //   .selectAll('div.colorCategories')
    //   .data(catData);
    // catt.enter().append('div')
    //   .attr('class', 'colorCategories')
    //   .style('width', cellDimension + 'px')
    //   .style('height', cellHeight + 'px')
    //   .style('height', (d, i) => (dispHistogram === true) ? binScale(d.count) + 'px' : cellHeight + 'px')
    //   //.style('height', (d, i) => binScale(d.count) + 'px')
    //   .style('background-color', (d) => d.color);

    const catEntries = d3.select(node).append('div').classed('catentries', true);
    const catListDiv = catEntries
      .selectAll('div.categories')
      .data(catData);

    catListDiv.enter().append('div')
      .attr('class', 'categories1')
      //.style('flex-grow', 1)

      .style('height', (d, i) => (dispHistogram === true) ? binScale(d.count) + 'px' : cellHeight + 'px')
      .style('width', cellDimension + 'px')
      //.style('height', (d, i) => binScale(d.count) + 'px')
      .style('background-color', (d) => d.color)
      //.style('flex-grow', 1)

      .append('div')
      .attr('class', 'categories')
      .style('height', cellHeight + 'px')
      .style('width', cellDimension + 'px')
      //.style('height', (d, i) => binScale(d.count) + 'px')
      .style('background-color', 'transparent')

      .on('mouseover', function (d, i) {
        toolTip.transition()
          .duration(200)
          .style('opacity', 1);
        toolTip.html(`${d.name}<br> Entries: ${d.count}`)
          .style('left', ((<any>d3).event.pageX) + 'px')
          .style('top', ((<any>d3).event.pageY - 10) + 'px');
      })
      .on('mouseout', function (d) {
        toolTip.transition()
          .duration(500)
          .style('opacity', 0);
      })
      .on('click', function (d, i) {
        console.log(d)
        d3.select(this).classed('active', !d3.select(this).classed('active'));
         d3.select(this.parentElement).classed('active', !d3.select(this).classed('active'));
        //    d3.select(that.node).select('colorCategories').classed('active', !d3.select(this).classed('active'));
        if (d3.select(this).classed('active') === false) {
          const cat = that._activeCategories;
          cat.push(d);
          that._activeCategories = cat;

          //  that.onClick(cat);
          that.triggerFilterChanged();

        } else if (d3.select(this).classed('active') === true) {
          let ind = -1;
          const cat = that._activeCategories;
          for (let i = 0; i < cat.length; ++i) {
            if ((<any>cat[i]).name === d.name) {
              ind = i;
            }
          }
          cat.splice(ind, 1);
          that._activeCategories = cat;
          that.triggerFilterChanged();

        }
      });


    catListDiv.exit().remove();


    const catlabels = d3.select(node).append('div').classed('catlabels', true);

    const catNames = catlabels
      .selectAll('div.catNames')
      .data(catData);
    catNames.enter().append('div')
      .attr('class', 'catNames')
      .text((d, i) => d.name);
    catNames.exit().remove();

  }

  async filter(current: Range1D) {
    const vectorView = await(<any>this.data).filter(findCatName.bind(this, this._activeCategories));
    const filteredRange = await vectorView.ids();
    const rangeIntersected = current.intersect(filteredRange);
    const fullRange = (await this.data.ids()).size();
    const vectorRange = filteredRange.size();

    this.activeFilter = this.checkFilterApplied(fullRange[0], vectorRange[0]);


    // console.log(t === filteredRange);
    // console.log(t.dim(0).asList(),filteredRange.dim(0).asList(),vectorView.data())
    return rangeIntersected;
  }


}


function isSame(value, compareWith) {
  return value === compareWith;
}


function findCatName(catName: any[], value, index,) {

  for (const x in catName) {
    if (catName[x].name === value) {
      return value;
    }
  }
  return;
}

