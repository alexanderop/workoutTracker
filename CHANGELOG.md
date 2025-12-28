# [1.3.0](https://github.com/alexanderop/workoutTracker/compare/v1.2.0...v1.3.0) (2025-12-28)


### Features

* **exercises:** add cable and machine exercises ([4c5d1ef](https://github.com/alexanderop/workoutTracker/commit/4c5d1ef8aa5fd20c2da34a21b1647c2d104c7b5f))



# [1.2.0](https://github.com/alexanderop/workoutTracker/compare/v1.1.0...v1.2.0) (2025-12-22)


### Features

* **timers:** add workout logging for completed timer sessions ([#78](https://github.com/alexanderop/workoutTracker/issues/78)) ([ad88581](https://github.com/alexanderop/workoutTracker/commit/ad88581a0bc9af5ff1258f6469c76863710715c4)), closes [#79](https://github.com/alexanderop/workoutTracker/issues/79) [/github.com/alexanderop/workoutTracker/pull/78#issuecomment-3684350707](https://github.com//github.com/alexanderop/workoutTracker/pull/78/issues/issuecomment-3684350707)



# [1.1.0](https://github.com/alexanderop/workoutTracker/compare/v1.0.0...v1.1.0) (2025-12-22)


### Bug Fixes

* **docs:** correct formatting of commit patterns in version bump instructions ([cf0e39c](https://github.com/alexanderop/workoutTracker/commit/cf0e39cf42ca621aa398d26a5151a1a285563521))


### Features

* **ui:** add locale-aware decimal input support ([#77](https://github.com/alexanderop/workoutTracker/issues/77)) ([e639982](https://github.com/alexanderop/workoutTracker/commit/e6399827d3e84f87dca4393e71ad109dcd1c743d))



# [1.0.0](https://github.com/alexanderop/workoutTracker/compare/bdbb51a3c7c5bb657c3d80dc992c71b8a1056704...v1.0.0) (2025-12-22)


### Bug Fixes

* **a11y:** add screen reader labels for table columns ([0d2c710](https://github.com/alexanderop/workoutTracker/commit/0d2c710baaacb3f82a1656f424ae500c180ae526))
* **a11y:** remove redundant aria-labels causing label-content-name-mismatch ([5fcce72](https://github.com/alexanderop/workoutTracker/commit/5fcce72002b6f0c5039894c9a5a957fc4d8a2268))
* **audio:** resume suspended AudioContext for mobile/PWA compatibility ([9b41ae5](https://github.com/alexanderop/workoutTracker/commit/9b41ae5c19e36394d9c64beae981bb8c49031636))
* **benchmarks:** add deep watch for exercise list reactivity ([44df02b](https://github.com/alexanderop/workoutTracker/commit/44df02b68a2bafaf4cb431155555deef65f7f40c))
* **ci:** collapse QA_MODE expression to single line for YAML compatibility ([3e16be7](https://github.com/alexanderop/workoutTracker/commit/3e16be740563e00ffa3a0bb9eb75dbaa3805b54e))
* **ci:** disable inherited Lighthouse preset assertions ([75b85af](https://github.com/alexanderop/workoutTracker/commit/75b85af8742837b44961af3f7d16e9c8c1accde4))
* **ci:** ensure path aliases resolve in test projects ([952914c](https://github.com/alexanderop/workoutTracker/commit/952914c3385a776af53a60712c8ce2aa39e97057))
* **ci:** escape markdown in JS template to fix YAML parsing ([630b0b1](https://github.com/alexanderop/workoutTracker/commit/630b0b1c36f8bbb055f42c3cd3b3983930bc33d4))
* **ci:** fail pipeline when Claude QA finds critical issues ([74368bd](https://github.com/alexanderop/workoutTracker/commit/74368bd4556b97a136d118225b939fdfc0a44d03))
* **ci:** use bash parameter expansion for multiline PR body ([0520503](https://github.com/alexanderop/workoutTracker/commit/05205036822eb5766ea723aeecffa7fe6f946113))
* **ci:** use correct screenshot tool name (browser_take_screenshot) ([234208c](https://github.com/alexanderop/workoutTracker/commit/234208c04565274607918c3fec9efc7a142b13ff))
* **ci:** use OAuth token for Playwright exploration workflow ([6603f78](https://github.com/alexanderop/workoutTracker/commit/6603f78816894ffce8f2d7fe4d20e7cbe857a1ab))
* **composables:** remove unused SwipeToRevealOptions export ([a4a0646](https://github.com/alexanderop/workoutTracker/commit/a4a0646c2f5f16d39c2beaf9379ac0a1e3094a06))
* **dates:** remove unused export from isSupportedLocale ([a3b3b82](https://github.com/alexanderop/workoutTracker/commit/a3b3b823f0def29760a4bcda5986ccbb6ae5122a))
* **i18n:** fix duplicate identifier in DefineLocaleMessage ([90a3289](https://github.com/alexanderop/workoutTracker/commit/90a328946c811a5bb5b9111fcebf56933d4981f1))
* **i18n:** remove export from module augmentation interface ([528ae7a](https://github.com/alexanderop/workoutTracker/commit/528ae7a34c39c47e20a9efd07e64ea056fd8eb47))
* **knip:** include eslint-local-rules in project scope ([8b38dbb](https://github.com/alexanderop/workoutTracker/commit/8b38dbbdcdefb75db73f2a1744fafafd80fef145))
* **settings:** align import data button with export button ([358995d](https://github.com/alexanderop/workoutTracker/commit/358995ddb23f606689a01a8612bd63bcbf1d1d8c))
* skip debounced save after component unmount ([e3f37f7](https://github.com/alexanderop/workoutTracker/commit/e3f37f78feb28eb2741e165d051e31ab9b358b0d))
* **test:** add proper cleanup to workout-set-editing tests ([692a1a2](https://github.com/alexanderop/workoutTracker/commit/692a1a2e8b88fc8b4c9f3ae38eca55d42277b27f))
* **test:** flush debounced saves to prevent flaky test ([dc8cd31](https://github.com/alexanderop/workoutTracker/commit/dc8cd31f5f75409b71a1ee99ca8aee96a5d5f5e0))
* **test:** make navigateToExercises selector more specific ([e5653b1](https://github.com/alexanderop/workoutTracker/commit/e5653b12ae190a23e4ccbce80068c47c1807a2bd))
* **test:** use selectExercise helper for timed block test ([78870b3](https://github.com/alexanderop/workoutTracker/commit/78870b3072e4426d3807d8e1fd5a378b9398f816))
* **test:** wait for debounced saves in beforeEach ([37fee8e](https://github.com/alexanderop/workoutTracker/commit/37fee8e4567bc498402930ef07ae29e80b6cec15))
* **timers:** guard against double-completion to prevent infinite loops ([093a351](https://github.com/alexanderop/workoutTracker/commit/093a35130988db258b2bf7e1dfc23f3dcf3e8b33))
* **types:** make internal Zod schemas private to fix Knip unused exports ([811c212](https://github.com/alexanderop/workoutTracker/commit/811c212581380a8e79ed3ac8de2b9edb2622fb37))
* **wake-lock:** add tab visibility handling to prevent lock release on app switch ([4af076d](https://github.com/alexanderop/workoutTracker/commit/4af076d80e2b47197dda9e1fc029620c633aa1d0))
* **wake-lock:** add video fallback for bulletproof screen wake ([b9902c1](https://github.com/alexanderop/workoutTracker/commit/b9902c104aa30b81fa0cd169fe8147856ff92d11))
* **wake-lock:** improve PWA standalone and forced release handling ([aaaf62a](https://github.com/alexanderop/workoutTracker/commit/aaaf62ae127e4f0d35d421c0dc0d79f39456e002))
* **workout:** add w-full class to flex container for proper width ([ebc4602](https://github.com/alexanderop/workoutTracker/commit/ebc46028da599d5f6612c9e99dc2dd36dbd8e524))
* **workout:** cardio block Done button now advances to next block ([f02e2cc](https://github.com/alexanderop/workoutTracker/commit/f02e2cc8d9ccc87fe8234073577165cbab742a06))
* **workout:** prevent text overflow in playlist item ([6df376c](https://github.com/alexanderop/workoutTracker/commit/6df376c7feac4e05f0b3e4e59f9a51cf2b2813c8))
* **workout:** resolve readonly computed warning on drag-and-drop reordering ([13cebff](https://github.com/alexanderop/workoutTracker/commit/13cebfff7e65350be395b3a28a8b796eadf7d676))
* **workout:** strengthen set validation and improve number conversion ([a97d46a](https://github.com/alexanderop/workoutTracker/commit/a97d46a060d604d0c53e367b994b24d46942bde9))


### Features

* add davia-documentation skill for handling documentation requests ([af57fb0](https://github.com/alexanderop/workoutTracker/commit/af57fb09defb297e781fb1b8529c7997e7e0e1fb))
* add Fowler's refactoring reviewer documentation for code quality assessment ([c89a136](https://github.com/alexanderop/workoutTracker/commit/c89a136f158ab28327f5d1831ded50b3da0312da))
* add mermaid diagrams for pinia stores flow, repositories architecture, and routing navigation; implement CI pipeline fixes for Vite plugin configuration and Pinia context in browser tests ([2125bbc](https://github.com/alexanderop/workoutTracker/commit/2125bbc17f6c60e2e7976bb9f04225b6c33f510d))
* add MobileDialogContent component for responsive dialog layouts ([f26cabe](https://github.com/alexanderop/workoutTracker/commit/f26cabe03e6f685ed661c7acc7b3cf3c9266dcee))
* add swipe-to-reveal gestures for workout block actions ([2c06739](https://github.com/alexanderop/workoutTracker/commit/2c067399921ea27c9a8b6eeeb8ff0a3ade83bb73))
* Add Vue composable testing guide and helper functions ([de98a89](https://github.com/alexanderop/workoutTracker/commit/de98a89cde68523f71ed2ec24700074c3e6f4cf9))
* add vue-reviewer agent and review-components command for improved Vue component analysis ([62296dd](https://github.com/alexanderop/workoutTracker/commit/62296dd23f1daf36e47462c2a24f30999f67522e))
* add workout duration tracking and resume state indicator ([d82fea0](https://github.com/alexanderop/workoutTracker/commit/d82fea031ff92321eb0b3d6c0757a7d1d252f39d))
* **benchmarks:** add attempt history tracking and display ([08548cb](https://github.com/alexanderop/workoutTracker/commit/08548cb9411813438c429dd4b3f5cedc0979c55a))
* **benchmarks:** add backward navigation for exercise correction ([83049af](https://github.com/alexanderop/workoutTracker/commit/83049af10d7d3e08bb22875ee3b89d098823bfaa))
* **benchmarks:** add benchmark deletion with confirmation dialog ([ae32477](https://github.com/alexanderop/workoutTracker/commit/ae3247799a742e115952df7744f71950eb94f49c))
* **benchmarks:** add benchmark detail view and improve test helpers ([ed2ddc7](https://github.com/alexanderop/workoutTracker/commit/ed2ddc78b540fc9685cf74e0995cac19320f6ca7))
* **benchmarks:** add benchmark editing with view/edit mode toggle ([fbc7642](https://github.com/alexanderop/workoutTracker/commit/fbc7642dbe515414e0a1da275c4f12cbcf4426fb))
* **benchmarks:** add completion screen for ForTime benchmarks ([0ffd007](https://github.com/alexanderop/workoutTracker/commit/0ffd00796608bf65f561903a163c2af529451ea0))
* **benchmarks:** add exercise completion animations and enhance UX ([8f337c6](https://github.com/alexanderop/workoutTracker/commit/8f337c6a06e73834bfda5284fb05ad0dfbcbce42))
* **benchmarks:** add exercise management and database persistence ([40b6857](https://github.com/alexanderop/workoutTracker/commit/40b6857fcb5158ea24e95559fa5546ff02c409b1))
* **benchmarks:** add exercise navigation for ForTime benchmarks ([d746611](https://github.com/alexanderop/workoutTracker/commit/d746611da6c4f6602db207acb61c14ce047849e7))
* **benchmarks:** add exercise queue drawer for benchmark workouts ([8941c02](https://github.com/alexanderop/workoutTracker/commit/8941c02cbca42450af22d2be56ceadc696811109))
* **benchmarks:** add global timer tracking for benchmark workouts ([c98c60b](https://github.com/alexanderop/workoutTracker/commit/c98c60b2a4bd4f470999410e9a523d6d7b1d53a5))
* **benchmarks:** add isolated infrastructure for benchmark workouts (Step 1) ([87d522e](https://github.com/alexanderop/workoutTracker/commit/87d522ec285fe66a6acd40960e5445297587e658))
* **benchmarks:** add personal best tracking and display ([6af818f](https://github.com/alexanderop/workoutTracker/commit/6af818fb7b6ebc447b111ca8607684fafb4054dc))
* **benchmarks:** implement benchmark creation form with type selection ([b2fdd47](https://github.com/alexanderop/workoutTracker/commit/b2fdd47135243951c779c5b3508de0ccd44042c0))
* **benchmarks:** implement complete isolation of benchmark workouts with new architecture and state management ([5bea314](https://github.com/alexanderop/workoutTracker/commit/5bea31493901542eebeae72e9c13e1d11b892b9b))
* **benchmarks:** implement focus mode for ForTime workouts ([57d6487](https://github.com/alexanderop/workoutTracker/commit/57d64870d7ad8193c972244acc9061d3b4fbf15d))
* **benchmarks:** redesign active workout UI with race-timing display ([#37](https://github.com/alexanderop/workoutTracker/issues/37)) ([3d04c1c](https://github.com/alexanderop/workoutTracker/commit/3d04c1ca2c577e40169529211f1a4d61edfb30af))
* **benchmarks:** replace NumberField with mobile-optimized number picker ([cdf58a6](https://github.com/alexanderop/workoutTracker/commit/cdf58a6c6ebfd3bff0af61ae869e500d62afdcad))
* **blocks:** improve timed block icons and visual distinction ([#57](https://github.com/alexanderop/workoutTracker/issues/57)) ([3a7bfd9](https://github.com/alexanderop/workoutTracker/commit/3a7bfd95594d6e8abfeca12230e2ca2517ca4e40))
* **calendar:** add workout calendar with week strip navigation ([#36](https://github.com/alexanderop/workoutTracker/issues/36)) ([d638dac](https://github.com/alexanderop/workoutTracker/commit/d638dacbc9619b0bf60ed0fa1f7c93a37d6f1a98))
* **ci:** add Claude Playwright MCP exploratory testing workflow ([0cefa15](https://github.com/alexanderop/workoutTracker/commit/0cefa15c653866bb058e3b2ea1db39a458cda82d))
* enhance testing infrastructure, add review agents, and refactor timer composables ([d8a6806](https://github.com/alexanderop/workoutTracker/commit/d8a680650341148bc56c0d05312864895559900e))
* **exercises:** add 80+ bodyweight exercises with duplicate validation ([e2a52e4](https://github.com/alexanderop/workoutTracker/commit/e2a52e4a740c8c34ed7ab440676aed7aaf7531e6))
* **exercises:** add equipment filter to exercise picker ([#58](https://github.com/alexanderop/workoutTracker/issues/58)) ([b792845](https://github.com/alexanderop/workoutTracker/commit/b79284581f7a1b9f45c41bd54bc719b1c2cc3484))
* **exercises:** add exercise editing and improve code organization ([#66](https://github.com/alexanderop/workoutTracker/issues/66)) ([25cbc21](https://github.com/alexanderop/workoutTracker/commit/25cbc21cbf030ac7df321aa9d9403d609cd90de8))
* **exercises:** add exercise progress view with charts ([#61](https://github.com/alexanderop/workoutTracker/issues/61)) ([94d1ad9](https://github.com/alexanderop/workoutTracker/commit/94d1ad994b9d34a143b1c478843f30640c4588a7))
* **exercises:** add image upload for custom exercises ([#64](https://github.com/alexanderop/workoutTracker/issues/64)) ([eb5471b](https://github.com/alexanderop/workoutTracker/commit/eb5471b4049f8a7ac829c069eb8372212f57b21b))
* **exercises:** add muscle filtering and improve search experience ([ffcbd5d](https://github.com/alexanderop/workoutTracker/commit/ffcbd5d583e564e706f306da94283000f230136d))
* **exercises:** add popular exercises list and custom exercise creation ([3b27775](https://github.com/alexanderop/workoutTracker/commit/3b27775b51703b32924bb78df766650abd405ecf))
* **gestures:** implement swipe-to-reveal actions for workout blocks on touch devices ([bc0d07f](https://github.com/alexanderop/workoutTracker/commit/bc0d07fcd31af41cc6d04dacb7927856ef7367de))
* **history:** add dedicated workout history page with recent workouts on home ([84d1e07](https://github.com/alexanderop/workoutTracker/commit/84d1e07a4521de747c12a000c18b48bdb6919a22))
* **i18n:** implement internationalization with vue-i18n ([325793a](https://github.com/alexanderop/workoutTracker/commit/325793ae698755dc14a9d22c9196723f07a38903))
* implement active workout view with UI components and routing ([6bf310b](https://github.com/alexanderop/workoutTracker/commit/6bf310bd7c0a6a0697c3ee9d4bde3c3858c0f5ef))
* implement dark mode theme toggle with e2e tests ([bdbb51a](https://github.com/alexanderop/workoutTracker/commit/bdbb51a3c7c5bb657c3d80dc992c71b8a1056704))
* **log-past-workout:** add retroactive workout logging feature ([#48](https://github.com/alexanderop/workoutTracker/issues/48)) ([91f22eb](https://github.com/alexanderop/workoutTracker/commit/91f22eb8d0a5cf5e0a3a1f60400289b91330d47f))
* **persistence:** add IndexedDB-backed workout persistence and resume functionality ([d6345cb](https://github.com/alexanderop/workoutTracker/commit/d6345cb608b18ee1499f6e72aecc9e6ab90171e3))
* **pwa:** implement progressive web app with offline support and installability ([ba805ed](https://github.com/alexanderop/workoutTracker/commit/ba805ed8080a2a16ef5549ab1a8b58eb6aefc3ae))
* **pwa:** implement smart automatic updates ([#56](https://github.com/alexanderop/workoutTracker/issues/56)) ([1a544d2](https://github.com/alexanderop/workoutTracker/commit/1a544d261c0747d27cd0378035f0d7963f6845dc))
* **settings:** add adjustable timer sound volume control ([6e7c915](https://github.com/alexanderop/workoutTracker/commit/6e7c91560c32f7467f445936166ab203a2ebe09c))
* **settings:** add device features section to test wake lock support ([4088612](https://github.com/alexanderop/workoutTracker/commit/40886128680cc2c443bb6e91c0563f299f4a327b))
* **settings:** add version info and update notification ([b2a28bc](https://github.com/alexanderop/workoutTracker/commit/b2a28bc1121fc7f561306ffa5a35ed2c5db8d60a))
* **settings:** add video fallback test for screen wake lock ([a323a3a](https://github.com/alexanderop/workoutTracker/commit/a323a3a0d2186b8c74691ecf2345c651548676f3))
* **settings:** implement unit conversion for weight and height with toggle UI ([44fe39c](https://github.com/alexanderop/workoutTracker/commit/44fe39ce1d790872a7ae5d773bb7bd1a3f3f9447))
* **templates:** add ability to save completed workouts as templates ([cc990e3](https://github.com/alexanderop/workoutTracker/commit/cc990e3c0cd2df80e2843af8165a28ffabb22ff0))
* **templates:** implement template creation and management views ([7ac4be8](https://github.com/alexanderop/workoutTracker/commit/7ac4be8f51972da517f19206a7db58e6bca4ad0a))
* **templates:** refactor template detail logic and add save-as-template dialog ([4e817b5](https://github.com/alexanderop/workoutTracker/commit/4e817b5e7eebb1016e016feb38b7123ab3a34752))
* **test:** add vitest browser testing setup ([14d106c](https://github.com/alexanderop/workoutTracker/commit/14d106cf0f17b5c961b1f220a575244a68f2db18))
* **test:** migrate to integration-focused testing with vitest 4 and browser automation ([8235174](https://github.com/alexanderop/workoutTracker/commit/8235174cf84b177704b65818e3aa5b19deb81501))
* **timers:** add standalone timer view with quick access from home ([e96031a](https://github.com/alexanderop/workoutTracker/commit/e96031a5f6e09b811b79744e46f1bb95bf6a5cd3))
* **timers:** enhance gym-floor readability with larger displays and reorganized layouts ([f9d2a37](https://github.com/alexanderop/workoutTracker/commit/f9d2a3705fb8d61071459a636608cff906a19ca1))
* **timers:** implement audio cues for timed workouts ([b59ca2d](https://github.com/alexanderop/workoutTracker/commit/b59ca2d641af74e6c94f9ea55e701b8d00d5695b))
* **timers:** integrate PageLayout component across timer screens ([730bdda](https://github.com/alexanderop/workoutTracker/commit/730bddaaa1c0745604a2d23242471cc1a86e618e))
* **timers:** track and expose timer running state to parent components ([f22823f](https://github.com/alexanderop/workoutTracker/commit/f22823f3f4dd963bcefad827fa93f4af17aa3f50))
* **ui:** add NumericInput component with accessibility improvements ([#67](https://github.com/alexanderop/workoutTracker/issues/67)) ([ddbaaea](https://github.com/alexanderop/workoutTracker/commit/ddbaaea74be36ae4f3056bcb87bccb93e04b3aae))
* **units:** integrate unit conversion across workout views and add comprehensive tests ([55637d4](https://github.com/alexanderop/workoutTracker/commit/55637d4f3c51d627bf75c571c0746f397a0f8212))
* update workout initialization and enhance UI components for better user experience ([ebf62d0](https://github.com/alexanderop/workoutTracker/commit/ebf62d0fe39c3cd564471b990c99d257d54d4e45))
* **workout-detail:** implement comprehensive workout detail view with stats and animations ([b09c6c8](https://github.com/alexanderop/workoutTracker/commit/b09c6c80c094251ff62575e5fd0bdc62fba5959a))
* **workout:** add cardio block type for running, cycling, rowing activities ([#38](https://github.com/alexanderop/workoutTracker/issues/38)) ([159ca8b](https://github.com/alexanderop/workoutTracker/commit/159ca8b8713730933de85fb797d9aee1018e2764))
* **workout:** add completion screen after finishing workout ([46c153a](https://github.com/alexanderop/workoutTracker/commit/46c153aeb3066ed77cecd9cfa3a74eecaa9a981c))
* **workout:** add custom workout naming with integration tests ([4d8715a](https://github.com/alexanderop/workoutTracker/commit/4d8715a0542ff90fad73c94c01af93b41b0703fe))
* **workout:** add drag-and-drop exercise reordering ([13fee78](https://github.com/alexanderop/workoutTracker/commit/13fee781dce2d61323ff61609266997ee442d345))
* **workout:** add exercise editing and set management ([b9ff618](https://github.com/alexanderop/workoutTracker/commit/b9ff6188ee256fd7d28bf15c3ff140540cc44102))
* **workout:** add finish workout confirmation dialog ([7b92d40](https://github.com/alexanderop/workoutTracker/commit/7b92d4048c7d10d483e754d9da0e607d850ef596))
* **workout:** add support for CrossFit workout types and hybrid sessions ([c1a82f4](https://github.com/alexanderop/workoutTracker/commit/c1a82f4dce345c78557e5e8c6d996730457b8404))
* **workout:** add wake lock to keep screen awake during active workouts ([df858b4](https://github.com/alexanderop/workoutTracker/commit/df858b46a0b46290e6f9a708d50481d4f951ba55))
* **workout:** add workout detail view with navigation and shared formatters ([a226774](https://github.com/alexanderop/workoutTracker/commit/a2267747a666462991675862098eb49bdf8913f5))
* **workout:** add workout queue drawer to view and manage active block queue ([167f64f](https://github.com/alexanderop/workoutTracker/commit/167f64f751a88238a2daedc0c3783b65187c116b))
* **workout:** add workout summary view and celebration animations ([a40dc22](https://github.com/alexanderop/workoutTracker/commit/a40dc22b1011bd0a4e2363f182e01a3648cbdb0a))
* **workout:** enhance workout functionality with set completion logic and timer integration ([e1857e2](https://github.com/alexanderop/workoutTracker/commit/e1857e229bafc17382f29852369cce22558bc78b))
* **workout:** implement cancel workout functionality with confirmation dialog ([89ba843](https://github.com/alexanderop/workoutTracker/commit/89ba84362727065e22e408e3466e160f52df92da))
* **workout:** implement redo workout functionality with database factories ([d3e7fcb](https://github.com/alexanderop/workoutTracker/commit/d3e7fcb09e41691a6794cc6cc8225d5d5c905e14))
* **workout:** improve active workout UX with queue management and data prefill ([#65](https://github.com/alexanderop/workoutTracker/issues/65)) ([7264a54](https://github.com/alexanderop/workoutTracker/commit/7264a5443c6a7e375bfce2e3bab8356d202bb619))
* **workout:** integrate NumericInput modal for touch devices ([#68](https://github.com/alexanderop/workoutTracker/issues/68)) ([ac73a33](https://github.com/alexanderop/workoutTracker/commit/ac73a3348854046849303a07b0d39d4e525c255f))
* **workouts:** add benchmarks tab and create benchmark view ([89dd01e](https://github.com/alexanderop/workoutTracker/commit/89dd01e335fb7d93a882cba8bf1c86fbb7b9c984))
* **workout:** support decimal weight input for micro plates ([#51](https://github.com/alexanderop/workoutTracker/issues/51)) ([77846d5](https://github.com/alexanderop/workoutTracker/commit/77846d5b39f00b86a5af95bce23b563fbd0dce60))


### Performance Improvements

* **db:** use Dexie orderBy and add versionchange handler ([#52](https://github.com/alexanderop/workoutTracker/issues/52)) ([9be54f8](https://github.com/alexanderop/workoutTracker/commit/9be54f8e46d4563cc4756e092cd81ec929c6b5b2))



