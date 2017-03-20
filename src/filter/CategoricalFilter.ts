/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AVectorFilter from './AVectorFilter';
import {ICategoricalVector} from 'phovea_core/src/vector';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';
import SortEventHandler, {SORT, stringSort} from '../SortEventHandler/SortEventHandler';
import CategoricalColumn from '../column/CategoricalColumn';
import {on, fire} from 'phovea_core/src/event';

export default class CategoricalFilter extends AVectorFilter<string, ICategoricalVector> {
  readonly $node: d3.Selection<any>;
  private _filterDim: {width: number, height: number};
  private _activeCategories: string[];
  private _sortCriteria: string = SORT.asc;


  constructor(data: ICategoricalVector, $parent: d3.Selection<any>) {
    super(data);
    this.$node = this.build($parent);
    on(AVectorFilter.EVENT_SORTBY_FILTER_ICON, this.sortByFilterIcon.bind(this));
    this.attachListener();

  }

  protected build($parent: d3.Selection<any>) {
    const $node = super.build($parent);
    // node.innerHTML = `<button>${this.data.desc.name}</button>`;
    // (<HTMLElement>node.querySelector('button')).addEventListener('click', () => {
    //
    //   this.triggerFilterChanged();
    // });


    this.generateLabel($node, this.data.desc.name);
    const dispHistogram: boolean = true;
    this.generateCategories($node.select('main'), dispHistogram);

    return $node;
  }

  private attachListener() {
    const splitIcon = this.$node.select('header').insert('a', ':first-child')
      .classed('fa fa-bars', true);
    splitIcon.on('click', () => {
      d3.selectAll('.fa.fa-bars').style('border', null);
      const b = splitIcon.attr('class');
      if (b === 'fa fa-bars') {
        fire(CategoricalColumn.EVENT_STRATIFYME, this.data.desc.id);
        splitIcon.style('border', '1px solid');
      } else {
        splitIcon.style('border', 'none');
      }

    });

  }

  sortByFilterIcon(evt: any, sortData: {sortMethod: string, col}) {
    if (sortData.col !== this) {
      return;
    }

    this._sortCriteria = sortData.sortMethod;
    this.$node.select('main').remove();
    this.$node.append('main');
    this.generateCategories(this.$node.select('main'), true);
  }

  get filterDim(): {width: number; height: number} {
    this._filterDim = {width: 205, height: 35};
    return this._filterDim;
  }

  set filterDim(value: {width: number; height: number}) {
    this._filterDim = value;
  }


  private async generateCategories($node: d3.Selection<any>, dispHistogram: boolean) {
    const that = this;
    const cellHeight = this.filterDim.height;
    const allCatNames = await(<any>this.data).data();
    const categories = (<any>this.data).desc.value.categories;

    const c20 = d3.scale.category20();
    const toolTip = (this.generateTooltip($node));
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

    const onClick = function (d, $this) {
      $this.classed('active', !$this.classed('active'));
      if ($this.classed('active') === false) {
        $this.select('.categoriesColor').style('background-color', (d) => d.color);
        const l = $node.selectAll('.catNames');
        const v = l[0].filter((e) => (<any>e).__data__.name === d.name);
        d3.select(v[0]).style('color', 'black');
        const cat = that._activeCategories;
        cat.push(d);
        that._activeCategories = cat;
        that.triggerFilterChanged();

      } else if ($this.classed('active') === true) {
        $this.select('.categoriesColor').style('background-color', null);
        const l = $node.selectAll('.catNames');
        const v = l[0].filter((e) => (<any>e).__data__.name === d.name);
        d3.select(v[0]).style('color', null);
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
    };

    const catEntries = $node.append('div').classed('catentries', true);
    const binScale = d3.scale.linear()
      .domain([0, d3.max(catData, (d) => d.count)]).range([0, this._filterDim.height]);

    that._activeCategories = catData;
    const sortedCatData = catData.slice().sort(catObjectsort.bind(this, this._sortCriteria));
    const catListDiv = catEntries
      .selectAll('div.categories')
      .data(sortedCatData);

    catListDiv.enter().append('div')
      .attr('class', 'categoriesTransparent')
      .attr('title', (d) => `${d.name}: ${d.count}`)
      .style('height', cellHeight + 'px')
      .on('click', function (d) {
        onClick(d, d3.select(this));
      })
      .append('div')
      .attr('class', 'categoriesColor')
      .style('height', (d, i) => (dispHistogram === true) ? binScale(d.count) + 'px' : cellHeight + 'px')
      .style('background-color', (d) => d.color);

    catListDiv.exit().remove();
    const catlabels = $node.append('div').classed('catlabels', true);
    const catNames = catlabels
      .selectAll('div.catNames')
      .data(sortedCatData);
    catNames.enter().append('div')
      .attr('class', 'catNames')
      .style('color', 'black')
      .attr('title', (d) => `${d.name}: ${d.count}`)
      .text((d, i) => d.name)
      .on('click', function (d, i) {
        onClick(d, d3.select(catListDiv[0][i]));
      });
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

function catObjectsort(sortCriteria, a, b) {
  const aVal = a.name.toUpperCase();
  const bVal = b.name.toUpperCase();

  if (sortCriteria === SORT.asc) {

    return (aVal.localeCompare(bVal));
  }
  if (sortCriteria === SORT.desc) {


    return (bVal.localeCompare(aVal));
  }
}

