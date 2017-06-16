import SupportView from './SupportView';
import {INumericalMatrix} from 'phovea_core/src/matrix/IMatrix';
/**
 * Created by Martin on 13.06.2017.
 */

export default class MatrixSupportView extends SupportView {
  constructor(public readonly matrix: INumericalMatrix, $parent: d3.Selection<any>, id: number) {
    super(matrix.coltype, $parent, id);
  }

  protected addDefaultColumn() {
    console.log('No default column for Matrix');

  }

}
