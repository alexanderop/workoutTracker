import composableMustUseVue from './composable-must-use-vue'
import extractConditionVariable from './extract-condition-variable'
import noHardcodedColors from './no-hardcoded-colors'
import repositoryTryCatch from './repository-trycatch'

export default {
  rules: {
    'composable-must-use-vue': composableMustUseVue,
    'extract-condition-variable': extractConditionVariable,
    'no-hardcoded-colors': noHardcodedColors,
    'repository-trycatch': repositoryTryCatch,
  },
}
