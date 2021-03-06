/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AVectorFilter from './AVectorFilter';
import {ICategoricalVector} from 'phovea_core/src/vector';
import {Range1D} from 'phovea_core/src/range';
import * as d3 from 'd3';
import SortHandler, {SORT, stringSort} from '../SortHandler/SortHandler';
import CategoricalColumn from '../column/CategoricalColumn';
import {on, fire} from 'phovea_core/src/event';
import {ICatHistogram} from 'phovea_core/src/math';
import {debug} from 'util';

export default class CategoricalFilter extends AVectorFilter<string, ICategoricalVector> {
  readonly $node: d3.Selection<any>;
  private _filterDim: { width: number, height: number };
  private _activeCategories: string[];
  private _sortCriteria: string = SORT.asc;


  constructor(data: ICategoricalVector, $parent: d3.Selection<any>) {
    super(data);
    this.$node = this.build($parent);
    // on(AVectorFilter.EVENT_SORTBY_FILTER_ICON, this.sortByFilterIcon.bind(this));
  }

  protected build($parent: d3.Selection<any>) {
    const $node = super.build($parent);
    this.generateLabel($node);
    const dispHistogram: boolean = true;
    this.generateCategories($node.select('main'), dispHistogram);
    return $node;
  }

  protected addSortIcon($node: d3.Selection<any>) {
    const $stratifyButton = $node.append('a')
      .attr('title', 'Stratify table by this column')
      .classed('stratifyByMe', true)
      .html(`<i class="fa fa-columns fa-rotate-270 fa-fw" aria-hidden="true"></i><span class="sr-only">Stratify table by this column</span>`)
      .on('click', () => {
        fire(CategoricalColumn.EVENT_STRATIFYME, this);
      });

    on(CategoricalColumn.EVENT_STRATIFYME, (evt, ref) => {
      $stratifyButton.classed('active', ref.data.desc.id === this.data.desc.id);
    });

    super.addSortIcon($node);
  }

  showStratIcon(isVisible: boolean) {
    this.$node.select('.fa-columns').classed('hidden', !isVisible);
  }

  stratifyByMe(isTrue: boolean) {
    const check = this.$node.select('.stratifyByMe').classed('active');
    if (check !== isTrue) {
      this.$node.select('.stratifyByMe').classed('active', isTrue);
    }
  }


  sortByFilterIcon(sortData: { sortMethod: string, col }) {
    if (sortData.col !== this) {
      return;
    }

    this._sortCriteria = sortData.sortMethod;
    this.$node.select('main').remove();
    this.$node.append('main');
    this.generateCategories(this.$node.select('main'), true);
  }

  get filterDim(): { width: number; height: number } {
    this._filterDim = {width: 205, height: 35};
    return this._filterDim;
  }

  set filterDim(value: { width: number; height: number }) {
    this._filterDim = value;
  }


  private async generateCategories($node: d3.Selection<any>, dispHistogram: boolean) {
    const that = this;
    const cellHeight = this.filterDim.height;
    const hist = <ICatHistogram> await this.data.hist();
    const bins = [];
    hist.forEach((d, i) => bins.push(d));
    const catData = [];
    const categories = (<any>this.data.desc.value).categories;
    const nameToLabel = new Map<string, string>();
    if (categories) {
      // replace each item in data with label
      categories.forEach((d) => {
        nameToLabel.set(d.name, d.label);
      });
    }
    hist.categories.forEach((c, i) => catData.push({'name': (nameToLabel.has(c)) ? nameToLabel.get(c) : c, 'id': c, 'count': bins[i], 'color': hist.colors[i]}));
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

function isSame<T>(value: T, compareWith: T) {
  return value === compareWith;
}


function findCatName(catName: any[], value: string) {
  const res = catName.find((x) => x.id === value);
  if(res) {
    return res;
  }
  return;
}


function catObjectsort(sortCriteria: string, a: { name: string }, b: { name: string }) {
  const aVal = a.name.toUpperCase();
  const bVal = b.name.toUpperCase();

  if (sortCriteria === SORT.asc) {

    return (aVal.localeCompare(bVal));
  }
  if (sortCriteria === SORT.desc) {


    return (bVal.localeCompare(aVal));
  }
}
