/**
 * Created by Katarína Furmanová on 13.03.2017.
 */
import MultiForm from 'phovea_core/src/multiform/MultiForm';
import {IVisPluginDesc} from 'phovea_core/src/vis';
import {AnyColumn} from './ColumnManager';
import Range from 'phovea_core/src/range/Range';

import {
  VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  VALUE_TYPE_STRING
} from 'phovea_core/src/datatype';
import AColumn from './AColumn';


export enum EAggregationType {
  AGGREGATED,
  UNAGGREGATED,
  AUTOMATIC
}

export interface IVisOptions {
  /**
   * Minimal Width
   * @default 20
   */
  minWidth?: number;
  /**
   * Minimal Height
   * @default 10
   */
  minHeight?: number;
  /**
   * Maximal Width
   * @default 50
   */
  maxWidth?: number;
  /**
   * Maximal Height
   * @default 100
   */
  maxHeight?: number;
  /**
   * Minimal Row Height
   * @default 2
   */
  rowMinHeight?: number;
  /**
   * Maximal Row Height
   * @default 10
   */
  rowMaxHeight?: number;
  /**
   * Minimal Column Width
   * @default 2
   */
  columnMinWidth?: number;
  /**
   * Maximal Column Width
   * @default 10
   */
  columnMaxWidth?: number;
}


export default class VisManager {

  public static readonly stringOptions: IVisOptions = {
    rowMinHeight: 19,
    rowMaxHeight: 20,
    columnMinWidth: 10,
    columnMaxWidth: 100,
    minWidth: 20,
    maxWidth: 100
  };
  public static readonly barplotOptions: IVisOptions = {
    rowMinHeight: 4,
    rowMaxHeight: 20,
    minWidth: 40,
    maxWidth: 50
  };
  public static readonly heatmap1DOptions: IVisOptions = {
    rowMinHeight: 4,
    rowMaxHeight: 20,
    minWidth: 20,
    maxWidth: 50
  };
  public static readonly heatmapOptions: IVisOptions = {
    rowMinHeight: 4,
    rowMaxHeight: 20,
    columnMinWidth: 2,
    columnMaxWidth: 10
  };
  public static readonly boxplotOptions: IVisOptions = {
    minHeight: 10,
    maxHeight: 50,
    minWidth: 20,
    maxWidth: 50
  };
  public static readonly propSymbolOptions: IVisOptions = {
    rowMinHeight: 10,
    rowMaxHeight: 20,
    minWidth: 20,
    maxWidth: 50
  };
  public static readonly histogramOptions: IVisOptions = {
    minHeight: 20,
    maxHeight: 50,
    minWidth: 20,
    maxWidth: 20
  };
  public static readonly mosaicOptions: IVisOptions = {
    rowMinHeight: 4,
    rowMaxHeight: 20,
    minWidth: 20,
    maxWidth: 50
  };

  private readonly vissesOptions: {[id: string]: IVisOptions};

  public static aggregatedNumVisses = ['phovea-vis-histogram', 'phovea-vis-box'];
  public static unaggregatedNumVisses = ['barplot', 'proportionalSymbol', 'phovea-vis-heatmap1d', 'list'];
  public static aggregatedCatVisses = ['phovea-vis-histogram'];
  public static unaggregatedCatVisses = ['phovea-vis-heatmap1d'];
  public static aggregatedStrVisses = ['list'];//TODO change to empty vis
  public static unaggregatedStrVisses = ['list'];
  public static aggregatedNumMatVisses = ['phovea-vis-histogram'];
  public static unaggregatedNumMatVisses = ['phovea-vis-heatmap'];


  /**
   * User selected visualization for multiform with given id
   */
  public static userSelectedAggregatedVisses: Map<number, IVisPluginDesc> = new Map<number, IVisPluginDesc>();
  public static userSelectedUnaggregatedVisses: Map<number, IVisPluginDesc> = new Map<number, IVisPluginDesc>();
  public static multiformAggregationType: Map<number, EAggregationType> = new Map<number, EAggregationType>();
  public static modePerGroup: EAggregationType[] = [];


  constructor() {
    this.vissesOptions = {
      'table': VisManager.stringOptions,
      'barplot': VisManager.barplotOptions,
      'list': VisManager.stringOptions,
      'phovea-vis-heatmap1d': VisManager.heatmap1DOptions,
      'phovea-vis-heatmap': VisManager.heatmapOptions,
      'phovea-vis-histogram': VisManager.histogramOptions,
      'phovea-vis-mosaic': VisManager.mosaicOptions,
      'phovea-vis-box': VisManager.boxplotOptions,
      'proportionalSymbol': VisManager.propSymbolOptions
    };
  }

  static getDefaultVis(columnType: string, dataType: string, aggregationType) {
    switch (aggregationType) {
      case EAggregationType.AGGREGATED:
        switch (columnType) {
          case AColumn.DATATYPE.vector:
            switch (dataType) {
              case VALUE_TYPE_STRING:
                return 'list';
              case VALUE_TYPE_INT:
              case VALUE_TYPE_REAL:
                return 'phovea-vis-histogram';
              case VALUE_TYPE_CATEGORICAL:
                return 'phovea-vis-histogram';
            }
            break;

          case AColumn.DATATYPE.matrix:
            return 'phovea-vis-histogram';
        }
        return 'list'; // default value

      case EAggregationType.UNAGGREGATED:
        switch (columnType) {
          case AColumn.DATATYPE.vector:
            switch (dataType) {
              case VALUE_TYPE_STRING:
                return 'list';
              case VALUE_TYPE_INT:
              case VALUE_TYPE_REAL:
                return 'barplot';
              case VALUE_TYPE_CATEGORICAL:
                return 'phovea-vis-heatmap1d';
            }
            break;

          case AColumn.DATATYPE.matrix:
            return 'phovea-vis-heatmap';
        }
        return 'list'; // default value
    }
  }

  static getPossibleVisses(columnType: string, dataType: string, aggregationType) {
    switch (aggregationType) {
      case EAggregationType.AGGREGATED:
        switch (columnType) {
          case AColumn.DATATYPE.vector:
            switch (dataType) {
              case VALUE_TYPE_STRING:
                return VisManager.aggregatedStrVisses;
              case VALUE_TYPE_INT:
              case VALUE_TYPE_REAL:
                return VisManager.aggregatedNumVisses;
              case VALUE_TYPE_CATEGORICAL:
                return VisManager.aggregatedCatVisses;
            }
            break;

          case AColumn.DATATYPE.matrix:
            return VisManager.aggregatedNumMatVisses;
          default:
            return;
        }
        return; // default value

      case EAggregationType.UNAGGREGATED:
        switch (columnType) {
          case AColumn.DATATYPE.vector:
            switch (dataType) {
              case VALUE_TYPE_STRING:
                return VisManager.unaggregatedStrVisses;
              case VALUE_TYPE_INT:
              case VALUE_TYPE_REAL:
                return VisManager.unaggregatedNumVisses;
              case VALUE_TYPE_CATEGORICAL:
                return VisManager.unaggregatedCatVisses;
            }
            break;

          case AColumn.DATATYPE.matrix:
            return VisManager.unaggregatedNumMatVisses;
          default:
            return;
        }
        return; // default value
    }
  }

  static setUserVis(id: number, vis: IVisPluginDesc, aggregationType) {
    if (aggregationType === EAggregationType.AGGREGATED) {
      VisManager.userSelectedAggregatedVisses.set(id, vis);
    } else {
      VisManager.userSelectedUnaggregatedVisses.set(id, vis);
    }
  }

  static updateUserVis(idOld: number, idNew: number) {
    if (VisManager.userSelectedAggregatedVisses.has(idOld)) {
      VisManager.userSelectedAggregatedVisses.set(idNew, VisManager.userSelectedAggregatedVisses.get(idOld));
    }
    if (VisManager.userSelectedUnaggregatedVisses.has(idOld)) {
      VisManager.userSelectedUnaggregatedVisses.set(idNew, VisManager.userSelectedUnaggregatedVisses.get(idOld));
    }
  }

  static removeUserVisses(id: number) {
    VisManager.userSelectedAggregatedVisses.delete(id);
    VisManager.userSelectedUnaggregatedVisses.delete(id);
  }

  /**
   * Compute minimum height of column depending on
   * minimal size of user-selected visualizations and
   * minimal size of visualizations available for given datatype
   */
  computeMinHeight(col: AnyColumn): number [] {
    const minColumnHeight: number[] = [];
    col.multiformList.forEach((multiform, index) => {
      let minHeight;
      if (multiform.brushed && VisManager.modePerGroup[index] !== EAggregationType.AGGREGATED) {
        minHeight = multiform.data.dim[0] * 20;
      }
      else if (VisManager.userSelectedAggregatedVisses.has(multiform.id)
        && VisManager.multiformAggregationType.get(multiform.id) === EAggregationType.AGGREGATED) {
        minHeight = this.minVisSize(VisManager.userSelectedAggregatedVisses.get(multiform.id).id, multiform.data.dim)[1];
      } else if (VisManager.userSelectedUnaggregatedVisses.has(multiform.id)
        && VisManager.multiformAggregationType.get(multiform.id) === EAggregationType.UNAGGREGATED) {
        minHeight = this.minVisSize(VisManager.userSelectedUnaggregatedVisses.get(multiform.id).id, multiform.data.dim)[1];
      } else {
        minHeight = Number.POSITIVE_INFINITY;
        const visses = VisManager.getPossibleVisses(multiform.data.desc.type, multiform.data.desc.value.type, VisManager.multiformAggregationType.get(multiform.id));
        visses.forEach((v) => {
          const minHeightTmp = this.minVisSize(v, multiform.data.dim)[1];
          minHeight = (minHeight > minHeightTmp) ? minHeightTmp : minHeight;
        });
      }
      minColumnHeight.push(minHeight);
    });
    return minColumnHeight;
  }


  minVisSize(vis: string, dims: number[]): number[] {
    let minVisHeight;
    let minVisWidth;
    switch (vis) {
      case ('table'):
        minVisHeight = (dims[0] + 1) * this.vissesOptions[vis].rowMinHeight;
        minVisWidth = ((dims[1] + 1) || 1) * this.vissesOptions[vis].columnMinWidth;
        break;
      case ('list'):
        minVisHeight = dims[0] * this.vissesOptions[vis].rowMinHeight;
        minVisWidth = this.vissesOptions[vis].minWidth;
        break;
      case ('barplot'):
        minVisHeight = dims[0] * this.vissesOptions[vis].rowMinHeight;
        minVisWidth = this.vissesOptions[vis].minWidth;
        break;
      case ('phovea-vis-heatmap1d'):
        minVisHeight = dims[0] * this.vissesOptions[vis].rowMinHeight;
        minVisWidth = this.vissesOptions[vis].minWidth;
        break;
      case ('phovea-vis-heatmap'):
        minVisHeight = dims[0] * this.vissesOptions[vis].rowMinHeight;
        minVisWidth = (dims[1] || 1) * this.vissesOptions[vis].columnMinWidth;
        break;
      case ('phovea-vis-histogram'):
        minVisHeight = this.vissesOptions[vis].minHeight;
        minVisWidth = this.vissesOptions[vis].minWidth;
        break;
      case ('phovea-vis-box'):
        minVisHeight = this.vissesOptions[vis].minHeight;
        minVisWidth = this.vissesOptions[vis].minWidth;
        break;
      case ('phovea-vis-mosaic'):
        //TODO correct mosaic height
        minVisHeight = dims[0] * this.vissesOptions[vis].rowMinHeight;
        minVisWidth = this.vissesOptions[vis].minWidth;
        break;
      case('proportionalSymbol'):
        minVisHeight = dims[0] * this.vissesOptions[vis].rowMinHeight;
        minVisWidth = this.vissesOptions[vis].minWidth;
        break;
      default:
        minVisHeight = 50;
        minVisWidth = 20;
    }
    return [minVisWidth, minVisHeight];
  }

  assignVis(multiform: MultiForm) {
    if (VisManager.userSelectedAggregatedVisses.has(multiform.id)
      && VisManager.multiformAggregationType.get(multiform.id) === EAggregationType.AGGREGATED) {

      multiform.switchTo(VisManager.userSelectedAggregatedVisses.get(multiform.id));

    } else if (VisManager.userSelectedUnaggregatedVisses.has(multiform.id)
      && VisManager.multiformAggregationType.get(multiform.id) === EAggregationType.UNAGGREGATED) {

      multiform.switchTo(VisManager.userSelectedUnaggregatedVisses.get(multiform.id));

    } else {
      const preferredVis = VisManager.getDefaultVis(multiform.data.desc.type, multiform.data.desc.value.type, VisManager.multiformAggregationType.get(multiform.id));
      multiform.switchTo(preferredVis);
    }
  }
}



