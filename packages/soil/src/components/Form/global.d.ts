import * as Types from './types';
import * as Models from './models';

declare global {
  namespace MyForm {
    export { Types, Models };
  }
}
