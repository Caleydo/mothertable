/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import AVectorFilter from './AVectorFilter';
import {ICategoricalVector} from 'phovea_core/src/vector';
import * as d3 from 'd3';
import {SORT} from '../sort';
import CategoricalColumn from '../column/CategoricalColumn';
import {on, fire} from 'phovea_core/src/event';
import Range from 'phovea_core/src/range/Range';
import {ICatHistogram} from 'phovea_core/src/math';

interface IHistElem {
  count: number;
  name: string;
  color: string;
}

export default class CategoricalFilter extends AVectorFilter<string, ICategoricalVector> {
  readonly $node: d3.Selection<any>;
  filterDim = {width: 205, height: 35};
  private readonly activeCategories = new Set<string>();
  private allCategories: IHistElem[];
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
      $stratifyButton.classed('active', ref && ref.data.desc.id === this.data.desc.id);
    });

    super.addSortIcon($node);
  }

  showStratIcon(isVisible: boolean) {
    this.$node.select('.fa-columns').classed('hidden', !isVisible);
  }

  stratifyByMe(isTrue: boolean) {
    this.$node.select('.stratifyByMe').classed('active', isTrue);
  }


  sortByFilterIcon(sortData: { sortMethod: string, col }) {
    if (sortData.col !== this) {
      return;
    }

    this._sortCriteria = sortData.sortMethod;
    this.resortHist();
  }


  private computeRealHistogram(): Promise<IHistElem[]> {
    const colors = d3.scale.category20().range().slice();
    return this.data.hist().then((hist: ICatHistogram) => {
      return hist.categories.map((cat, i) => {
        const count = hist.frequency(i);
        const color = hist.colors ? hist.colors[i] : colors[i % colors.length];
        return {count, color, name: cat};
      })
        .filter((d) => d.count > 0); // filter out empty bins
    });
  }

  private async generateCategories($node: d3.Selection<any>, dispHistogram: boolean) {
    const cellHeight = this.filterDim.height;
    const catData = await this.computeRealHistogram();
    this.allCategories = catData;
    // by default all
    catData.forEach((bin) => this.activeCategories.add(bin.name));

    const onClick = (d: IHistElem, $this: d3.Selection<IHistElem>) => {
      // active it is wasn't active before
      const active = !$this.classed('active');

      //update styles
      $this
        .classed('active', active)
        .select('.categoriesColor').style('background-color', active ? d.color : null);
      $node.select(`div.catNames[data-cat="${d.name}"]`).style('color', active ? 'black': null);

      if (active) {
        this.activeCategories.add(d.name);
      } else {
        this.activeCategories.delete(d.name);
      }
      this.triggerFilterChanged();
    };

    const binScale = d3.scale.linear()
      .domain([0, d3.max(catData, (d) => d.count)]).range([0, this.filterDim.height]);

    const $bins = $node.append('div').classed('catentries', true).selectAll('div.categoriesTransparent').data(catData);

    $bins.enter().append('div')
      .attr('class', 'categoriesTransparent active')
      .attr('title', (d) => `${d.name}: ${d.count}`)
      .style('height', cellHeight + 'px')
      .on('click', function (d) {
        onClick(d, d3.select(this));
      })
      .append('div')
      .attr('class', 'categoriesColor')
      .style('height', (d, i) => (dispHistogram === true) ? binScale(d.count) + 'px' : cellHeight + 'px')
      .style('background-color', (d) => d.color);

    $bins.exit().remove();

    const catlabels = $node.append('div').classed('catlabels', true);
    const $binLabels = catlabels
      .selectAll('div.catNames')
      .data(catData);

    $binLabels.enter().append('div')
      .attr('class', 'catNames')
      .attr('data-cat', (d) => d.name)
      .style('color', 'black')
      .attr('title', (d) => `${d.name}: ${d.count}`)
      .text((d, i) => d.name);
    $binLabels.exit().remove();

    this.resortHist();
  }

  private resortHist() {
    function compare(a: IHistElem, b: IHistElem) {
      const an = a.name ? a.name.toLowerCase() : '';
      const bn = b.name ? b.name.toLowerCase() : '';
      return an.localeCompare(bn);
    }
    const comparator = this._sortCriteria === SORT.asc ? compare : (a, b) => -compare(a, b);
    this.$node.select('.catentries').selectAll('div.categoriesTransparent').sort(comparator);
    this.$node.select('.catlabels').selectAll('div.catNames').sort(comparator);
  }

  filter(current: Range) {
    return this.filterImpl(current, (this.activeCategories.size === this.allCategories.length) ? Promise.resolve(this.data) : this.data.filter((d) => this.activeCategories.has(d)));
  }
}
