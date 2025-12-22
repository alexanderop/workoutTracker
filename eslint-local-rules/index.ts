import composableMustUseVue from './composable-must-use-vue'
import noHardcodedColors from './no-hardcoded-colors'
import repositoryTryCatch from './repository-trycatch'

export default {
  rules: {
    'composable-must-use-vue': composableMustUseVue,
    'no-hardcoded-colors': noHardcodedColors,
    'repository-trycatch': repositoryTryCatch,
  },
}
