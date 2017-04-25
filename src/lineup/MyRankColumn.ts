/**
 * Created by Samuel Gratzl on 25.04.2017.
 */

import ValueColumn, {IValueColumnDesc} from 'lineupjs/src/model/ValueColumn';
import Range1D from 'phovea_core/src/range/Range1D';

/**
 * custom rank column with filter functions
 */
export default class RankColumn extends ValueColumn<number> {
  private range = Range1D.all();

  constructor(id: string, desc: IValueColumnDesc<number>) {
    super(id, desc);
    this.setWidthImpl(50);
  }

  setFilter(range: Range1D) {
    if (this.range.eq(range)) {
      return;
    }
    this.fire(RankColumn.EVENT_FILTER_CHANGED, this.range, this.range = range);
  }

  /**
   * flag whether any filter is applied
   * @return {boolean}
   */
  isFiltered() {
    return !this.range.isAll;
  }

  /**
   * predicate whether the current row should be included
   * @param row
   * @param index the row index
   * @return {boolean}
   */
  filter(row: any, index: number) {
    return this.range.contains(row);
  }
}
