import i18n from '@i18n/index';

/**
 * 叙事数据文件 — 唯一文本来源
 * 锚定文档：docs/08-GARDEN-NARRATIVE.md v2.0
 *
 * 8 件收藏品 × 4 档品质 = 32 段故事
 * 所有游戏内叙事文案必须从本文件派生，不得在代码中临时改写
 *
 * @version 2.0
 */

/**
 * 叙事收藏品定义
 * 每件收藏品包含 4 个品质档位（初芽/翠叶/繁花/盛放）
 * 每个品质包含：unlockKey、unlockConditionText、shortText、story、diaryFragments
 */
export const NARRATIVE_COLLECTIBLES = [
  // ═══════════════════════════════════════
  // 5.1 小花盆 — 关于开始
  // ═══════════════════════════════════════
  {
    id: 'small-pot',
    name: '小花盆',
    icon: 0,
    theme: '关于开始',
    description: '第一次走进花园。',
    tiers: [
      {
        tierId: 'sprout',
        tierName: '初芽',
        unlockKey: 'first_practice_walk',
        unlockConditionText: '完成第一次练习散步。',
        shortText: '花盆底下还有一点湿。像是刚刚有人浇过水。',
        story: `她第一次养花，花不是旱死的，是被她浇死的。

那只土陶花盆是母亲从集市带回来的，盆沿有一道小缺口。母亲说："以后这盆花归你照看。"

她高兴坏了。早上浇一遍，中午趁人不注意再浇一遍，傍晚看见土面不够黑，又补了一点。第三天，托盘里的水满出来，沿着窗台往下滴。第五天，叶子全垂下去了，像一群刚被老师点名的小孩。

她蹲在院子里，不肯吃饭。

母亲没有骂她，只把花盆端到她面前，说："你看，它不是不喜欢你。它只是喝不下了。"

第二天，母亲又带回来一只空盆。

那只空盆比开花还重要。因为它什么都没有，所以什么都可以重新开始。`,
        diaryFragments: [
          '她第一次养花，花不是旱死的，是被她浇死的。',
          '那只空盆比开花还重要。',
          '它不是不喜欢你。它只是喝不下了。'
        ]
      },
      {
        tierId: 'leaf',
        tierName: '翠叶',
        unlockKey: 'first_daily_training',
        unlockConditionText: '完成第一次日常训练。',
        shortText: '窗台上那截花枝没活过春天。但那把野草绿得很理直气壮。',
        story: `她第一次离开家时，书包里塞了一截带根的花枝。

别人带衣服、干粮、针线，她带一截花。有人笑她："它又不能当饭吃。"

她说："能当窗户。"

集体屋朝北，墙角总有一点潮。她把花枝插进破碗里，放在唯一能照到太阳的窗台上。每天早晨起床，她先看那截枝条。只要它还绿着，屋子就不像完全陌生。

后来，那截花枝没活过冬天。她把枯枝埋在屋后的坡上，埋得很认真，还用一块小石头压住土。

第二年春天，她去看，那里长出了一把野草。

不是原来的花。她知道。

但那把草绿得很理直气壮，像在说：我也可以算。`,
        diaryFragments: [
          '窗台上那截花枝没活过春天。',
          '那把野草绿得很理直气壮。',
          '有花的地方，才像家。'
        ]
      },
      {
        tierId: 'bloom',
        tierName: '繁花',
        unlockKey: 'try_higher_n',
        unlockConditionText: '尝试一次更高记忆距离。',
        shortText: '仙人掌开了一朵黄色的小花。花小得像一个悄悄举手的人。',
        story: `孩子从校门口买回一盆仙人掌，说它最好养。

"老板说，一个月浇一次水就行。"孩子把仙人掌放到厨房窗台上，像放下一位不需要照顾的亲戚。

一个月过去，她忘了浇水。  
两个月过去，她又忘了。  
第三个月，她想起来时，仙人掌开了一朵黄色的小花。

孩子冲进厨房："它开花了！你什么都没干，它就开花了！"

她盯着那朵小花看了很久。花小得像一个悄悄举手的人。

她说："看来它不喜欢被管得太勤。"

孩子立刻问："那我也可以吗？"

她说："你不一样。你会自己去翻糖罐。"

那盆仙人掌后来活了很久。久到家里换了几次窗帘，它还站在同一个窗台上，像一个脾气很好的小刺猬。`,
        diaryFragments: [
          '花小得像一个悄悄举手的人。',
          '看来它不喜欢被管得太勤。',
          '那盆仙人掌像一个脾气很好的小刺猬。'
        ]
      },
      {
        tierId: 'fullBloom',
        tierName: '盛放',
        unlockKey: 'seven_walks',
        unlockConditionText: '累计完成 7 次散步。',
        shortText: '那只空花盆后来真的长满了青苔。',
        story: `小姑娘第一次来花园时，认真数了花盆。

她数了三遍，得出三个答案。第一次十二，第二次十四，第三次十三。她很生气，认为花盆在偷偷移动。

她问："这些都是你种的吗？"

她指了指第二排角落里那只："那盆不是。它自己长出来的。"

"自己？"

"风带来的种子。它没问我，我也没问它，就让它住下了。"

小姑娘听完，跑到院子角落抱来一块石头，放进一只空花盆里。

"那我也带来一个。"

她看了看那块石头。石头灰扑扑，形状像一只不愿意醒来的馒头。

她说："好。先放着。说不定哪天它会长出点什么。"

后来，那只花盆真的长满了青苔。

小姑娘得意了很久，逢人就说："我种过石头。"`,
        diaryFragments: [
          '那只空花盆后来真的长满了青苔。',
          '石头灰扑扑，形状像一只不愿意醒来的馒头。',
          '我种过石头。'
        ]
      }
    ]
  },

  // ═══════════════════════════════════════
  // 5.2 浇水壶 — 关于照看
  // ═══════════════════════════════════════
  {
    id: 'watering-can',
    name: '浇水壶',
    icon: 2,
    theme: '关于照看',
    description: '每天回来一点点。',
    tiers: [
      {
        tierId: 'sprout',
        tierName: '初芽',
        unlockKey: 'streak_2',
        unlockConditionText: '连续 2 天回来。',
        shortText: '壶嘴长得像鸭子，小孩就很难尊重它作为工具的身份。',
        story: `家里有一把小水壶，壶嘴像鸭子。严格说，那不是她的玩具，是母亲买来浇花的。但只要壶嘴长得像鸭子，小孩就很难尊重它作为工具的身份。

她每次浇水，都要把壶嘴歪过来，假装鸭子在池塘里游。水一半落进花盆，一半落在她脚上。

母亲说："你这水浇得很公平。"

她低头看脚："花喝到了吗？"

"喝到了一点。"

"那地上呢？"

"地上也喝到了一点。"

她点点头，觉得自己照顾了很多东西，包括花、地、脚背和一只假鸭子。

后来她才知道，照看一件事，有时候确实会洒出来一些。洒出来的那部分，也不一定全算浪费。`,
        diaryFragments: [
          '壶嘴长得像鸭子，小孩就很难尊重它作为工具的身份。',
          '照看一件事，有时候确实会洒出来一些。',
          '洒出来的那部分，也不一定全算浪费。'
        ]
      },
      {
        tierId: 'leaf',
        tierName: '翠叶',
        unlockKey: 'streak_5',
        unlockConditionText: '累计完成 5 天散步。',
        shortText: '缸子缺口处竟然长出一棵小草。',
        story: `那几年，她用一个掉瓷的搪瓷缸浇花。

缸子原本是喝水的，后来磕掉一块，露出黑铁。喝水时总担心嘴唇碰到缺口，于是它被调去浇花。工具之间也会换工作，只是不写调令。

她每天早上把剩下的一口凉水倒到门口那株小花上。花很小，紫红色，顶在细细的茎上，像一枚不太服气的图钉。

有天，缸子又掉了一块瓷。她觉得它实在太破，放进柜子里。

很久以后翻出来，缺口处竟然长出一棵小草。根细得像头发，叶子只有两片，却站得很正。

她把缸子看了半天，说："你倒是会给自己安排去处。"

后来她把碎缸子埋回那株小花旁边。埋的时候，缸子里还有半勺土，不肯倒出来。`,
        diaryFragments: [
          '缸子缺口处竟然长出一棵小草。',
          '你倒是会给自己安排去处。',
          '缸子里还有半勺土，不肯倒出来。'
        ]
      },
      {
        tierId: 'bloom',
        tierName: '繁花',
        unlockKey: 'stable_session',
        unlockConditionText: '完成一次稳定训练。',
        shortText: '壶嘴的垫圈换过一次。像一只旧物替人记住了手的位置。',
        story: `丈夫从很远的地方带回一把细嘴浇水壶。

那壶嘴长得出奇地长，像一根安静的线。水从里面出来时细细的，不溅叶子，不冲泥土，落在哪里都像事先想过。

她试了一下，说："这壶比你细心。"

丈夫正在换鞋，抬头说："那是因为花不会顶嘴。"

她问："谁顶嘴？"

他举起手："我。我顶嘴。"

后来这把壶一直留在工具房。壶嘴的垫圈换过一次，手柄松过两次，壶身被磕出一个小坑。小坑的位置很奇怪，每次拿起来，拇指都会正好按在那里。

像一只旧物替人记住了手的位置。`,
        diaryFragments: [
          '壶嘴的垫圈换过一次。',
          '像一只旧物替人记住了手的位置。',
          '那是因为花不会顶嘴。'
        ]
      },
      {
        tierId: 'fullBloom',
        tierName: '盛放',
        unlockKey: 'streak_15',
        unlockConditionText: '累计完成 15 天散步。',
        shortText: '它说：够了，别再来了。',
        story: `花园里后来有很多把浇水壶。

大壶浇菜，小壶浇多肉，长嘴壶浇兰花，喷雾瓶照顾气生根，还有一把壶底漏了，她舍不得扔，拿来插干草。它终于不用装水，显得很轻松。

小姑娘问："为什么不买一把万能水壶？"

她想了想："万能的东西，通常谁都照顾得不太好。"

"那你记得住哪盆该用哪把吗？"

"记不住的时候，就看它们的脸色。"

小姑娘凑到一盆多肉前。多肉刚浇过水，叶子亮亮的，像刚吃完饭不愿意说话。

"它没说话。"小姑娘说。

"说了。"她把水壶放回架子上，"它说：够了，别再来了。"

小姑娘盯着多肉看了很久，最后点点头："它确实长得有点饱。"`,
        diaryFragments: [
          '它说：够了，别再来了。',
          '多肉刚浇过水，叶子亮亮的，像刚吃完饭不愿意说话。',
          '万能的东西，通常谁都照顾得不太好。'
        ]
      }
    ]
  },

  // ═══════════════════════════════════════
  // 5.3 露珠 — 关于看见
  // ═══════════════════════════════════════
  {
    id: 'dew',
    name: '露珠',
    icon: 3,
    theme: '关于看见',
    description: '没抓住，也可以算看见。',
    tiers: [
      {
        tierId: 'sprout',
        tierName: '初芽',
        unlockKey: 'no_false_alarms',
        unlockConditionText: '完成一局且没有误触。',
        shortText: '她记住了露珠消失前的样子。',
        story: `她小时候发现，露珠是圆的。

这事让她震惊了一个上午。她蹲在叶子前，盯着那颗小小的亮东西，觉得它像玻璃珠，又比玻璃珠胆小。她伸出手指，轻轻一碰，露珠碎了，顺着叶脉滚下去。

她愣住。

第二颗也是这样。  
第三颗，她忍住没碰。  

太阳慢慢升起来，第三颗露珠自己没了。

她很不服气："不碰也会没有。"

母亲说："是啊。有些东西就是这样，碰不碰都会走。"

她想了想，又蹲下去看第四颗。

那天她什么也没得到，裤脚还湿了。但她记住了露珠消失前的样子。

后来她发现，许多事情都只能这样：看见一下，已经很好。`,
        diaryFragments: [
          '她记住了露珠消失前的样子。',
          '有些东西就是这样，碰不碰都会走。',
          '看见一下，已经很好。'
        ]
      },
      {
        tierId: 'leaf',
        tierName: '翠叶',
        unlockKey: 'no_response_lte_1',
        unlockConditionText: '未作答不超过 1 次。',
        shortText: '露珠消失得很快。她却觉得自己多记住了一点东西。',
        story: `那几年，许多人又开始翻旧书。

她白天做活，夜里看借来的课本。纸页发黄，页角有别人写过又擦掉的算式，留下灰灰的一片，像一场小雪没扫干净。

有天凌晨，她背不进去，端着搪瓷缸走到屋外。天还没亮，田埂边全是露珠，一颗一颗挂在草尖上。它们不照亮路，也不照亮书，只是证明夜里并不空。

她站了一会儿，回屋，把那一页又读了一遍。

那天早上，露珠消失得很快。她却觉得自己多记住了一点东西。

不是因为露珠教了她什么。露珠没有那么多话。

只是它们都在那里，很小，很亮，很准时。`,
        diaryFragments: [
          '露珠消失得很快。她却觉得自己多记住了一点东西。',
          '露珠没有那么多话。',
          '它们都在那里，很小，很亮，很准时。'
        ]
      },
      {
        tierId: 'bloom',
        tierName: '繁花',
        unlockKey: 'stable_higher_n',
        unlockConditionText: '在更高记忆距离中完成一次稳定表现。',
        shortText: '留下来的，是一个人起床时，知道另一个人已经在院子里。',
        story: `孩子要去参加一场很重要的考试时，她没有做特别的饭，也没有站在门口反复叮嘱。

她只是比平时早起了一点，在花园里站了很久。

花还没完全醒，叶尖挂着露珠，天边灰蓝色，像一块还没拧干的布。她拿起水壶，从第一盆浇到最后一盆。水落进土里，声音很轻，但在清晨听起来特别清楚。

后来孩子说，那天早上他在屋里醒来，听见浇水的声音，忽然不那么慌了。

她说："那是水壶的功劳。"

孩子说："水壶又不知道我要考试。"

她说："所以它浇得很稳。"

那天露珠没有留下来。水声也没有留下来。留下来的，是一个人起床时，知道另一个人已经在院子里。`,
        diaryFragments: [
          '留下来的，是一个人起床时，知道另一个人已经在院子里。',
          '水壶又不知道我要考试。',
          '所以它浇得很稳。'
        ]
      },
      {
        tierId: 'fullBloom',
        tierName: '盛放',
        unlockKey: 'self_chosen_challenge',
        unlockConditionText: '完成一次自己选择的挑战。',
        shortText: '没拍到，但她看见了。',
        story: `小姑娘来花园拍照，说作业题目叫"完美的瞬间"。

她对着露珠拍了半天，不是嫌这颗太小，就是嫌那颗不够圆。拍了三十几张，删了三十几张。相机都快被她按出脾气。

她坐在台阶上，说："完美太难了。"

她没有劝，只坐在旁边，剥一根老了的豆角。豆角筋很长，扯到一半断了，她小声说："你看，它也不完美。"

这时一只蝴蝶飞来，停在一朵花上。小姑娘立刻举起相机。蝴蝶只停了两三秒，飞走了。

她没拍到。

奇怪的是，小姑娘没有生气。她盯着空了的花看了一会儿，说："刚才那个挺好。"

"没拍到。"

"但我看见了。"

她把相机放下来。那一刻，露珠已经干了，豆角筋还在她手上挂着，像一条没讲完的线。`,
        diaryFragments: [
          '没拍到，但她看见了。',
          '完美太难了。',
          '露珠已经干了，豆角筋还在她手上挂着，像一条没讲完的线。'
        ]
      }
    ]
  },

  // ═══════════════════════════════════════
  // 5.4 花瓣 — 关于记得
  // ═══════════════════════════════════════
  {
    id: 'petal',
    name: '花瓣',
    icon: 18,
    theme: '关于记得',
    description: '有些东西会变薄，但颜色还在。',
    tiers: [
      {
        tierId: 'sprout',
        tierName: '初芽',
        unlockKey: 'correct_30',
        unlockConditionText: '累计认对 30 次。',
        shortText: '花瓣真会藏东西。明明什么声音都没有，却把春天夹得满满一页。',
        story: `她小时候有一个秘密：作业本最后一页不是用来写作业的，是用来夹花瓣的。

桃花一页，梨花一页，月季一页。她用铅笔在旁边写：晴、风大、东边第二棵。字写得歪，花瓣夹得更歪。有一片桃花瓣夹进去时还带着水，后来把纸洇出一个浅浅的粉印。

冬天翻开本子，花瓣已经干透，轻轻一碰就碎。她不敢碰，只用眼睛看。

颜色还在。

淡了，但还在。

她觉得花瓣真会藏东西。明明什么声音都没有，却把春天夹得满满一页。`,
        diaryFragments: [
          '花瓣真会藏东西。明明什么声音都没有，却把春天夹得满满一页。',
          '颜色还在。淡了，但还在。',
          '有一片桃花瓣夹进去时还带着水。'
        ]
      },
      {
        tierId: 'leaf',
        tierName: '翠叶',
        unlockKey: 'correct_60',
        unlockConditionText: '累计认对 60 次。',
        shortText: '他们第一次说话，就像两片叶子在书页中间碰了一下。',
        story: `她在图书馆的一本旧书里发现一片银杏叶。

叶子被压得很平，像一把小扇子。旁边有一行铅笔字：秋天了。字很小，写的人大概怕被管理员发现，又忍不住想让别人发现。

她前后翻了翻，在借阅卡上看见上一位读者的名字。她没有记住名字，只记住那张卡上有一块指纹形状的灰。

后来，她在隔壁书架旁看见一个人，手里正捏着另一片银杏叶，犹豫夹在哪一页。

她走过去说："你上次那片叶子，我看见了。"

那人愣了一下："我还以为会被扔掉。"

"没有。"

"那就好。"

他们第一次说话，就像两片叶子在书页中间碰了一下。声音不大，但纸记住了。`,
        diaryFragments: [
          '他们第一次说话，就像两片叶子在书页中间碰了一下。',
          '声音不大，但纸记住了。',
          '我还以为会被扔掉。'
        ]
      },
      {
        tierId: 'bloom',
        tierName: '繁花',
        unlockKey: 'stable_streak',
        unlockConditionText: '连续几局保持稳定。',
        shortText: '至于有没有梦见花，她不知道。但枕头确实很香。',
        story: `有一年春天，花落得太多，院子像铺了一层不认真扫的彩纸。

她拿竹篮去捡花瓣。捡着捡着，隔壁的小姑娘也来了。小姑娘问："这些捡回去干什么？"

"晒干，做枕头。"

"睡了会梦见花吗？"

"也可能梦见扫地。"

小姑娘笑得差点把篮子踢翻。

她们捡了整整一篮。洗干净，晾在竹匾上。风一吹，花瓣翻身，像一群睡觉不老实的小孩。后来枕头做好，真的有香味。至于有没有梦见花，小姑娘第二天说梦见自己在花海里游泳，游到一半还被一只蜜蜂追。

她知道这可能是编的。

但枕头确实很香。编一点也没关系。`,
        diaryFragments: [
          '至于有没有梦见花，她不知道。但枕头确实很香。',
          '风一吹，花瓣翻身，像一群睡觉不老实的小孩。',
          '编一点也没关系。'
        ]
      },
      {
        tierId: 'fullBloom',
        tierName: '盛放',
        unlockKey: 'view_diary',
        unlockConditionText: '回看一次花园日记。',
        shortText: '今天下雨，花园里什么都没发生。但我们都在。',
        story: `她的花园日记堆了半柜。

每本封面都旧了，边角卷起来。里面夹着干花、树叶、鸟羽毛、一小段褪色的绳子，还有一张糖纸。糖纸为什么在里面，她自己也忘了。也许是因为那天糖好吃，也许是因为那天没发生别的事。

小姑娘翻到一页空白，问："这里怎么什么都没有？"

她看了一眼，说："本来想写一件事，后来忘了。"

"那你想起来了吗？"

"想起来了。"她指给小姑娘看。空白下面有一行字：

今天下雨，花园里什么都没发生。

小姑娘皱眉："这也要写？"

"要写。"她说，"不然以后会以为那天没有来过。"

小姑娘想了想，拿起笔，在那行字后面补了一句：

但我们都在。

她没有拦。日记本又厚了一点点。`,
        diaryFragments: [
          '今天下雨，花园里什么都没发生。',
          '但我们都在。',
          '不然以后会以为那天没有来过。'
        ]
      }
    ]
  },

  // ═══════════════════════════════════════
  // 5.5 小石头 — 关于积累
  // ═══════════════════════════════════════
  {
    id: 'small-stone',
    name: '小石头',
    icon: 24,
    theme: '关于积累',
    description: '一步一步，路就出现了。',
    tiers: [
      {
        tierId: 'sprout',
        tierName: '初芽',
        unlockKey: 'walks_10',
        unlockConditionText: '累计完成 10 次散步。',
        shortText: '石头好。花会谢，蝴蝶会飞走，石头不会跑。',
        story: `她小时候的口袋里总有石头。

圆的、扁的、湿了会变色的、像兔子头的、像馒头但不能吃的。母亲洗衣服前，总能从她口袋里掏出几块。石头被一块一块摆到窗台上，晒太阳，像犯了错还排队的孩子。

她给每块石头起名字。最大的叫石头爸爸，最小的叫石头宝宝，中间有一块缺了角，叫石头舅舅，因为它看起来很会讲闲话。

母亲说："你又不是石头养大的。"

她说："石头好。花会谢，蝴蝶会飞走，石头不会跑。"

后来她知道，石头也会变。会裂，会长苔，会被脚磨亮。

但小时候相信一块石头不会跑，也是一件很有用的事。`,
        diaryFragments: [
          '石头好。花会谢，蝴蝶会飞走，石头不会跑。',
          '石头舅舅，因为它看起来很会讲闲话。',
          '小时候相信一块石头不会跑，也是一件很有用的事。'
        ]
      },
      {
        tierId: 'leaf',
        tierName: '翠叶',
        unlockKey: 'walks_30',
        unlockConditionText: '累计完成 30 次散步。',
        shortText: '石头这东西，很少白忙。',
        story: `她第一次离开家的那几年，修过一段路。

办法很笨：搬石头，铺上去，敲平。再搬，再铺，再敲。手掌磨出茧，肩膀晒出两道印。下雨时泥水溅到裤腿上，干了以后像一张不太准确的地图。

路修好那天，她沿着自己铺的那一段走了三遍。

每一块石头她都认识。有一块是河边搬来的，有一块是院墙角挖出来的，还有一块从坡上滚下来，差点砸到她脚。她对那块尤其有意见，但还是把它铺进路里。

后来她离开，再也没有回去看那条路。

她常常想，那些石头可能还在那里。就算不在那里，也一定在别的什么地方垫着什么人的脚。

石头这东西，很少白忙。`,
        diaryFragments: [
          '石头这东西，很少白忙。',
          '她对那块尤其有意见，但还是把它铺进路里。',
          '那些石头可能还在那里。'
        ]
      },
      {
        tierId: 'bloom',
        tierName: '繁花',
        unlockKey: 'walks_50',
        unlockConditionText: '累计完成 50 次散步。',
        shortText: '不好铺。但铺上了。',
        story: `她有了自己的院子后，决定铺一条小路。

丈夫问："买什么石材？"

她说："不用买。"

从那以后，她每次出门都会带一块石头回来。湖边的，山脚的，工地剩下的，河滩上被水磨圆的。每块洗干净，翻过来，用铅笔写上来处。写完又觉得石头背面太粗，字很快会磨掉，于是改写在本子里。

路铺了很久。铺出来也不直，走十几步就完了。

丈夫说："这不是路，是日记。"

她蹲下来，指着其中一块："这块你嫌太圆，不好铺。"

"我说对了吗？"

"对了一半。"她把旁边的土按实，"不好铺。但铺上了。"

后来那块圆石头最容易打滑。她每次经过都骂它一句。骂了很多年，也没换掉。`,
        diaryFragments: [
          '不好铺。但铺上了。',
          '这不是路，是日记。',
          '骂了很多年，也没换掉。'
        ]
      },
      {
        tierId: 'fullBloom',
        tierName: '盛放',
        unlockKey: 'walks_100',
        unlockConditionText: '累计完成 100 次散步。',
        shortText: '缝深一点，能住进去的东西就多一点。',
        story: `那条石头路走了很多年。

有些石头被脚磨得发亮，有些长了青苔，有一块裂开了。小姑娘蹲在那块裂石头前，很严肃地问："要不要换新的？"

她也蹲下来，摸了摸裂缝。

"不换。"

"可是它裂了。"

"裂了也还是石头。它又没变成豆腐。"

小姑娘笑了一下，又指着缝里的一点绿："这里长东西了。"

"嗯。"她说，"缝深一点，能住进去的东西就多一点。"

小姑娘没有接话，开始数整条路有多少块石头。数到一半乱了，又从头数。数到第三遍，她宣布："这条路不配合。"

她说："路本来就不是用来数的。"

小姑娘站起来，在裂石头上轻轻踩了一下。青苔没有掉，像一块很小的垫子。`,
        diaryFragments: [
          '裂了也还是石头。它又没变成豆腐。',
          '缝深一点，能住进去的东西就多一点。',
          '这条路不配合。'
        ]
      }
    ]
  },

  // ═══════════════════════════════════════
  // 5.6 蝴蝶 — 关于相遇
  // ═══════════════════════════════════════
  {
    id: 'butterfly',
    name: '蝴蝶',
    icon: 7,
    theme: '关于相遇',
    description: '有些东西不能抓，只能等。',
    tiers: [
      {
        tierId: 'sprout',
        tierName: '初芽',
        unlockKey: 'streak_3',
        unlockConditionText: '连续答对 3 次。',
        shortText: '她觉得自己抓到了一点别的东西。虽然手里什么也没有。',
        story: `她小时候很想抓一只蝴蝶。

邻家的大孩子有捕虫网，一挥就能罩住一只。她也借来试。结果她每次刚举起网，就忍不住大叫。蝴蝶还没等网下来，已经飞到隔壁去了。

她跑了一下午，一只也没抓到。最后坐在花坛边生闷气，网放在脚边，像一把失败的伞。

一只白蝴蝶飞过来，停在她膝盖上。

她立刻不动了。连痒都忍住。蝴蝶停了很久，久到她怀疑它睡着了。她小声问："你是不是不知道我刚才想抓你？"

蝴蝶没回答。蝴蝶没有义务回答。

后来它飞走了。

她捡起网，觉得自己抓到了一点别的东西。虽然手里什么也没有。`,
        diaryFragments: [
          '她觉得自己抓到了一点别的东西。虽然手里什么也没有。',
          '蝴蝶没有义务回答。',
          '网放在脚边，像一把失败的伞。'
        ]
      },
      {
        tierId: 'leaf',
        tierName: '翠叶',
        unlockKey: 'streak_5_answer',
        unlockConditionText: '连续答对 5 次。',
        shortText: '肩上那一点黄还在，像谁不小心留下的一小块春天。',
        story: `离开学校那天，大家拍合影。

胶卷不多，照相的人说："别眨眼，也别笑太大。"每个人都站得很直，像一排刚插好的竹竿。

快门按下前，一只黄色小蝴蝶停在她肩上。

照片洗出来以后，大家先看见的不是人，是那只蝴蝶。有人说："幸好它来了，不然这张照片就和别的合影一样了。"

后来照片边角发黄，人的脸也有些模糊。只有肩上那一点黄还在，像谁不小心留下的一小块春天。

她把照片夹在书里。多年后再翻出来，蝴蝶的位置刚好被书页压出一道浅痕。

像它真的停过很久。`,
        diaryFragments: [
          '肩上那一点黄还在，像谁不小心留下的一小块春天。',
          '像它真的停过很久。',
          '幸好它来了。'
        ]
      },
      {
        tierId: 'bloom',
        tierName: '繁花',
        unlockKey: 'try_different_modes',
        unlockConditionText: '尝试不同素材或不同玩法。',
        shortText: '我蒙得有根有据。',
        story: `孩子小时候怕虫。

蚂蚁要绕路，蜗牛要远看，蝴蝶虽然好看，但在他看来仍然属于"会飞的虫子"，需要保持距离。

她没有逼他。只带他坐在花园石凳上剥豌豆。她剥一碗，孩子剥半碗，还把坏豆子偷偷放回好豆子堆里，被她抓到三次。

蝴蝶在花丛里飞。孩子偶尔看一眼，又低头剥豆。

剥到第三碗，他忽然说："那只颜色不一样。"

她顺着看过去："嗯，它翅膀边上有黑点。"

"它怎么知道自己是哪只？"

"也许照镜子。"

孩子看了她一眼，显然觉得这个答案不可靠。

后来孩子长大，真的去研究虫子。有一天他说："蝴蝶靠花纹认同类，你当年说得不算全错。"

她很高兴："我蒙得有根有据。"`,
        diaryFragments: [
          '我蒙得有根有据。',
          '也许照镜子。',
          '被她抓到三次。'
        ]
      },
      {
        tierId: 'fullBloom',
        tierName: '盛放',
        unlockKey: 'multi_mode_stable',
        unlockConditionText: '在多个玩法中都完成一次稳定表现。',
        shortText: '你看，它先认出来了。',
        story: `现在花园里有很多蝴蝶。

她认得出其中几只。不是每一只，至少三只。

一只浅黄，每年春天来得早。  
一只飞得歪，右边翅膀像短一点。  
还有一只灰色的，总停在石头路裂缝边上，像在检查工程质量。

小姑娘问："你怎么认得出来？它们不都差不多吗？"

"看多了就不一样。"她说，"有的来得早，有的吃饭慢，有的总喜欢同一朵花。有的飞得像没睡醒。"

小姑娘想了想："那我呢？你怎么认得我？"

她没有立刻回答，只把茶杯往小姑娘那边推了推。

那只浅黄蝴蝶飞过来，停在杯沿上，轻轻扇翅。

她说："你看，它先认出来了。"

小姑娘低头看杯子，认真得像在听一只蝴蝶宣读证词。`,
        diaryFragments: [
          '你看，它先认出来了。',
          '有的飞得像没睡醒。',
          '认真得像在听一只蝴蝶宣读证词。'
        ]
      }
    ]
  },

  // ═══════════════════════════════════════
  // 5.7 风车 — 关于变化
  // ═══════════════════════════════════════
  {
    id: 'pinwheel',
    name: '风车',
    icon: 4,
    theme: '关于变化',
    description: '风不一样，转法也不一样。',
    tiers: [
      {
        tierId: 'sprout',
        tierName: '初芽',
        unlockKey: 'use_1_mode',
        unlockConditionText: '使用 1 种玩法。',
        shortText: '有些东西先留着也很好。等风来的时候，它自己会提醒你。',
        story: `父亲会用旧纸做风车。

一张纸，几道折痕，一根细竹签，再加一颗小钉子。十分钟，一只风车就好了。她举着它跑过院子，跑过巷口，跑到风追不上她。

第一只风车散架得很快。纸片飞出去，竹签还在手里，钉子滚进了砖缝。

她哭着回家。

父亲又做了一只。这次纸厚一点，钉子钉得紧一点。

"还跑吗？"父亲问。

"跑。"

"跑快了还会散。"

"散了你再做。"

父亲笑了。后来她一共弄散了好几只风车。最后一只，她没拿出去跑，挂在床头。

不是因为不想跑了。

是因为她忽然觉得，有些东西先留着也很好。等风来的时候，它自己会提醒你。`,
        diaryFragments: [
          '有些东西先留着也很好。等风来的时候，它自己会提醒你。',
          '散了你再做。',
          '跑到风追不上她。'
        ]
      },
      {
        tierId: 'leaf',
        tierName: '翠叶',
        unlockKey: 'use_2_modes',
        unlockConditionText: '使用 2 种玩法。',
        shortText: '风原来也会把东西磨出手感。',
        story: `她第一次离开家的地方，路口有一架很大的风车。

风来的时候，它慢慢转，带动里面的磨盘。转一圈，木架子吱呀一声；再转一圈，又吱呀一声。它不像玩具风车那么轻快，更像一个不爱说话的老工匠。

有人说它太旧，该换了。

她每次路过都多看一眼。它确实旧，叶片边缘缺了一块，轴也不顺。可只要有风，它还是转。转得慢，但没有偷懒。

后来新的风车来了，旧的被拆下。她要了一小片旧叶片，带回去夹在工具房的墙缝里。

那片木头很薄，有一边被风磨得发亮。她偶尔摸一下，觉得风原来也会把东西磨出手感。`,
        diaryFragments: [
          '风原来也会把东西磨出手感。',
          '转得慢，但没有偷懒。',
          '像一个不爱说话的老工匠。'
        ]
      },
      {
        tierId: 'bloom',
        tierName: '繁花',
        unlockKey: 'use_3_modes',
        unlockConditionText: '使用 3 种玩法。',
        shortText: '它丑，但它很努力。',
        story: `孩子看上一个彩色风车。

买来的时候，它七彩鲜亮，转起来像一小团热闹。孩子举着它跑了三条街。回到家时，风车不转了，一片叶子折了，垂在那里，像累坏了。

她说："明天我们自己做一个。"

第二天，他们用硬纸板、胶水和铁丝做风车。她手工一般，孩子耐心更一般。红色纸贴反，绿色纸剪歪，本来要做六片叶，最后只剩四片能用。

风车装好后，歪得很有态度。

孩子说："这个比买的丑。"

她说："你去跑一下，看丑的会不会转。"

孩子跑了。风车慢悠悠转起来，每转一圈都发出扑扑声，像在说：我能转，只是我不想转太快。

孩子回来说："它丑，但它很努力。"

她说："那就挂起来。家里需要这种风车。"`,
        diaryFragments: [
          '它丑，但它很努力。',
          '风车歪得很有态度。',
          '家里需要这种风车。'
        ]
      },
      {
        tierId: 'fullBloom',
        tierName: '盛放',
        unlockKey: 'custom_rhythm',
        unlockConditionText: '自定义过一次节奏或玩法。',
        shortText: '同一阵风吹过，每只风车都转得不一样。',
        story: `花园围栏上后来挂了一排风车。

不是买来就挂上的。每一只都经过她的手。有的叶片剪得齐，有的歪；有的转得快，有的要很大的风才肯动；还有一只不管什么风都只转半圈，像想起什么又忘了。

小姑娘数过，一共十九只。数到最后，她说："它们像一群意见不统一的人。"

她觉得这个说法很准确。

小姑娘跑到围栏边，对着最近的风车吹气。第一只转了两圈，带起一点风，旁边第二只也晃了晃，第三只慢半拍才动。

风车们像在传一句听不清的话。

风停以后，它们一只只垂下来。最歪的那只还晃了两下，像最后一个没听懂的人。

她站在旁边看，忽然觉得，变化并不总是很大。有时候只是同一阵风吹过，每只风车都转得不一样。`,
        diaryFragments: [
          '同一阵风吹过，每只风车都转得不一样。',
          '它们像一群意见不统一的人。',
          '像最后一个没听懂的人。'
        ]
      }
    ]
  },

  // ═══════════════════════════════════════
  // 5.8 萤火虫 — 关于微光
  // ═══════════════════════════════════════
  {
    id: 'firefly',
    name: '萤火虫',
    icon: 6,
    theme: '关于微光',
    description: '夜里也不全是黑的。',
    tiers: [
      {
        tierId: 'sprout',
        tierName: '初芽',
        unlockKey: 'evening_or_quiet',
        unlockConditionText: '开启暮色主题或完成一次安静散步。',
        shortText: '它亮过一下。有时候，回应就是这么短。',
        story: `她第一次看见萤火虫，以为是星星掉下来了。

那点光在草丛上方一亮一灭，她追了半个院子，伸手去捧。手合上的时候，光从指缝里漏出去，飞到更远的地方。

母亲说："那不是星星，是虫。"

她不太相信。虫怎么会亮呢？虫应该忙着爬，或者忙着吓人，不该负责发光。

母亲想了想，说："也许它怕别人找不到它。"

她又追了两圈。后来累了，坐在台阶上看。那点光飞回来，在她脚边亮了一下，又灭了。

她小声说："我找到了。"

萤火虫没有停下，但它亮过一下。

有时候，回应就是这么短。`,
        diaryFragments: [
          '它亮过一下。有时候，回应就是这么短。',
          '也许它怕别人找不到它。',
          '我找到了。'
        ]
      },
      {
        tierId: 'leaf',
        tierName: '翠叶',
        unlockKey: 'streak_7',
        unlockConditionText: '累计完成 7 天散步。',
        shortText: '黑也不是一整块黑。',
        story: `有一段日子，她常在夜里看书。

灯很暗，油也要省。她把书挪到窗边，借一点月光。字有时候看得见，有时候看不见，像在和她玩捉迷藏。

有一晚，云把月亮遮住了。院子暗下来，书页变成一块灰。她正要合上书，草丛里亮起一点光。

然后第二点，第三点。

几只萤火虫在院子里慢慢飞，光不够照亮字，却足够让她知道，世界还没有睡死。

她对着那几点光，把白天背过的内容小声念了一遍。念错的地方，萤火虫也没指出来，态度很好。

后来她想，那天夜里并不是萤火虫帮她记住了什么。

是它们让她觉得，黑也不是一整块黑。`,
        diaryFragments: [
          '黑也不是一整块黑。',
          '念错的地方，萤火虫也没指出来，态度很好。',
          '世界还没有睡死。'
        ]
      },
      {
        tierId: 'bloom',
        tierName: '繁花',
        unlockKey: 'hard_then_complete',
        unlockConditionText: '在困难局后仍完成散步。',
        shortText: '床底也应该感到轻松。',
        story: `孩子小时候怕黑。

确切地说，是怕床底下有东西。每晚关灯前，他都趴到地上检查一遍。检查得很认真，像床底下藏着一只会写作业的怪物。

她带他去花园看萤火虫。

夜里风很轻，花影晃动。萤火虫绕着草丛飞，一点亮，一点灭。孩子站在花园中间，眼睛跟着一只，又跟丢，又找到另一只。

他的肩膀慢慢放松下来。

他问："它们为什么不怕黑？"

她站在暗处，想了半天，说："可能是因为它们自己带了一点亮。"

孩子沉默了一会儿："那我没有。"

她说："你有。只是你关灯前总忙着检查床底，没空看自己。"

孩子不太满意这个回答。但那天晚上，他只检查了一次床底。

这已经是很大的进步。床底也应该感到轻松。`,
        diaryFragments: [
          '床底也应该感到轻松。',
          '它们自己带了一点亮。',
          '没空看自己。'
        ]
      },
      {
        tierId: 'fullBloom',
        tierName: '盛放',
        unlockKey: 'streak_30',
        unlockConditionText: '累计完成 30 天散步，或在暮色主题下完成一次稳定训练。',
        shortText: '有些光，写出来反而变暗。',
        story: `小姑娘有一年夏天住了一周。

第一晚，她就发现萤火虫。她跑到工具房翻出一个玻璃罐，说要抓两只放在床头当夜灯。

她没有拦，只说："先看一会儿。"

小姑娘坐在草地上看。萤火虫在她面前飞，画出细细的光弧。一只停在她手背上，亮了三下，又飞走。像很有礼貌地说：我来过了，再见。

半小时后，玻璃罐还是空的。

她问："不抓了？"

小姑娘把罐子举起来，对着夜色看："装满了。"

"装满什么？"

"晚上的时间。"

她觉得这句话有点厉害，但没有夸。夸了小姑娘会得意，得意了可能又要抓两只证明自己。

第二天早上，草地上有一只死去的萤火虫。白天的光照着它，细细黑黑的，一点也不像夜里那样亮。

小姑娘把它夹进花园日记。夹在一页空白里。

那一页后来没有写字。因为有些光，写出来反而变暗。`,
        diaryFragments: [
          '有些光，写出来反而变暗。',
          '装满了。装满什么？晚上的时间。',
          '我来过了，再见。'
        ]
      }
    ]
  }
];

/**
 * 英文叙事覆盖数据
 * 说明：
 * - 中文仍以 NARRATIVE_COLLECTIBLES 为唯一原始源；
 * - 英文界面通过本覆盖层替换展示字段，避免收藏页 / 日记 / 结算页继续显示中文正文；
 * - 仅覆盖展示相关字段：name / description / shortText / story。
 */
const EN_NARRATIVE_OVERRIDES = {
  'small-pot': {
    name: 'Small Pot',
    description: 'A first step into the garden.',
    tiers: {
      sprout: {
        shortText: 'The soil under the pot was still damp, as if someone had just watered it.',
        story: `The first flower she ever tried to raise did not wither from thirst. She watered it to death.

The clay pot had a small chip on the rim. Her mother set it in front of her and said, "This one is yours to care for now."

She was delighted. She watered it in the morning, again at noon when no one was looking, and once more at dusk when the soil no longer looked dark enough. By the fifth day the leaves had gone soft, and she crouched in the yard refusing to eat.

Her mother did not scold her. She only lifted the pot and said, "It doesn't dislike you. It simply can't drink that much."

The next day her mother brought home an empty pot. It turned out that an empty pot could be more important than a blooming one. When nothing is inside yet, everything can begin again.`,
      },
      leaf: {
        shortText: 'The cutting on the windowsill did not survive the spring. The weeds did, vividly.',
        story: `The first time she left home, she tucked a cutting with roots into her schoolbag.

Other people packed clothes, needles, and dried food. She carried a piece of green. Someone laughed and said it could not be eaten. She answered, "No, but it can be a window."

The branch did not live through the cold season. She buried it carefully behind the house and marked the spot with a small stone.

When spring returned, a patch of wild grass came up there instead. It was not the same flower, and she knew that. But it was green with such certainty that the lonely room no longer felt completely unfamiliar.`,
      },
      bloom: {
        shortText: 'A crooked cactus survived, and so did the care that raised it.',
        story: `One day a child came home from the school gate with a cactus and declared it the easiest plant in the world to keep alive.

They still fussed over it together. Water was added too early, then too late, then a little too much again. The cactus never became beautiful in the neat, postcard way. It leaned, thickened unevenly, and carried small scars.

Yet it lived.

She looked at it for a long time and thought that perhaps care did not have to be flawless to count. Sometimes being looked after imperfectly was still another way of being loved.`,
      },
      fullBloom: {
        shortText: 'The empty pot she chose was not missing something. It was still waiting.',
        story: `When a little girl first came to the garden, she counted the pots with grave attention, as if every one of them were part of an exam.

There were blooming pots, leafy pots, and one chipped empty pot near the wall. That was the one she chose. She said it looked like it still had room for something important.

The child asked why anyone would keep an empty pot. She smiled and said that empty things are not always lacking. Sometimes they are only making space.

The girl nodded as if she understood completely. Then she placed the empty pot in a brighter corner, carefully, like a promise.`,
      },
    },
  },
  'watering-can': {
    name: 'Watering Can',
    description: 'A little care, day by day.',
    tiers: {
      sprout: {
        shortText: 'The can leaked a little, but she still remembered to water what mattered.',
        story: `When she was little, there was a small watering can at home with a duck-shaped spout.

Strictly speaking, it was a tool her mother used for flowers. But to a child, anything shaped like a duck quickly stopped being only a tool.

The can leaked if it was tilted wrong. Water often went where it was not meant to go. Even so, she liked carrying it from pot to pot, as if tending things were a kind of game.

Later she remembered that the first lesson in care was not precision. It was simply returning, again and again, with the intention to tend.`,
      },
      leaf: {
        shortText: 'The enamel mug was chipped, but the small ritual held the days together.',
        story: `For several years she watered flowers with an old enamel mug whose rim had lost its shine.

Those were hard days, full of memorising, repeating, and trying again. Sometimes she stepped outside before dawn with the mug in her hand simply to breathe for a moment.

She would water one pot, then another, listening to the soft sound of water entering the soil. The gesture was small, almost pointless, and yet it steadied her.

The mug was not elegant. The routine was. It reminded her that attention does not have to be grand to be faithful.`,
      },
      bloom: {
        shortText: 'A narrow-spout can taught her that care also needs measure.',
        story: `Her husband once brought home a narrow-spout watering can from far away.

It poured in a clean, careful line. Not too much, not too fast, never wasting water on the edge of the pot. She liked it immediately, though she did not say so aloud.

Over time she realised the can had given her more than convenience. It had given her a different rhythm. Care could be generous, yes, but it also needed proportion.

Not every plant needed the same amount. Not every day asked for the same tenderness. Love, like watering, was sometimes a matter of knowing where to stop.`,
      },
      fullBloom: {
        shortText: 'In the end, every watering can taught a slightly different way to care.',
        story: `Later there were many watering cans in the garden.

Some had wide mouths, some fine spouts, some handles that pinched the fingers, some that poured like a whisper. None of them worked in exactly the same way.

She kept using them anyway. One for seedlings. One for heavy summer days. One only because she liked how familiar it felt in her hand.

Looking across the shed, she began to think that care was like that too. The feeling may be the same, but the way it is given changes with time, season, and the thing being cared for.`,
      },
    },
  },
  dew: {
    name: 'Dewdrop',
    description: 'Even what slips away can still be seen.',
    tiers: {
      sprout: {
        shortText: 'She remembered how dew looked just before it disappeared.',
        story: `As a child she once discovered, with great seriousness, that dew was perfectly round.

She crouched beside a leaf for a long time, staring at the tiny bright bead as if it were a secret. It looked like a glass marble, only more timid. She touched it with a fingertip, and it broke apart at once.

Her mother said, "Some things are like that. They leave whether you touch them or not."

She came away with wet cuffs and empty hands. But she kept the image of the dew just before it vanished, and that stayed with her much longer than the drop itself.`,
      },
      leaf: {
        shortText: 'The dew went quickly. Still, she felt she had remembered a little more.',
        story: `In the years when she spent mornings bent over old books, some days began badly and refused to improve.

Once, before sunrise, she carried her enamel mug outside because the words on the page would not stay in place. The grass by the field ridge was full of dew, each drop holding a little of the night.

The dew disappeared quickly that morning, faster than she expected. Yet when she went back inside, the page felt less empty.

It was not because dew had taught her a lesson. It had said nothing at all. But its brief presence reminded her that not everything has to remain in order to matter.`,
      },
      bloom: {
        shortText: 'What stayed was not the dew, but the certainty that someone was already awake.',
        story: `On the morning of an important exam, she did not cook anything special and did not stand at the door repeating instructions.

Instead she rose early and watered the flowers while the sky was still grey-blue. Dew clung to the leaves. Water entered the soil with a quiet sound that seemed much louder in the stillness.

By the time the child stepped into the yard, the dew was already nearly gone.

What remained was something gentler: the feeling of waking up and realising that someone had been there before you, preparing the morning without needing to say much.`,
      },
      fullBloom: {
        shortText: 'The perfect moment vanished, but not everything meaningful vanished with it.',
        story: `A little girl once came to the garden with a camera and declared that her assignment was called "The Perfect Moment."

She spent a long time photographing dew, never satisfied. One drop was too small, another not round enough, a third not bright enough. By the time she put the camera down, the dew had already dried.

There was a bean fiber still clinging to her hand from the plants she had been helping with, like a thread from an unfinished story.

She looked at the child and suddenly understood that perfection has poor timing. What matters is not always what stays long enough to be captured.`,
      },
    },
  },
  petal: {
    name: 'Petal',
    description: 'Some things grow thinner, but their color remains.',
    tiers: {
      sprout: {
        shortText: 'The petals dried flat, but the color refused to leave.',
        story: `When she was young, the last page of her exercise book was never really for homework.

It was where she kept petals. She pressed them there carefully, smoothing the paper over them as if sealing away a piece of weather.

By the time she opened the notebook again, the petals had turned thin and fragile. Their softness was gone, but their color remained.

That was one of the first times she understood that change does not always erase beauty. Sometimes it only makes beauty quieter.`,
      },
      leaf: {
        shortText: 'A single leaf inside an old book could still carry a whole season.',
        story: `Years later she found a ginkgo leaf tucked inside a library book that no one seemed to have borrowed in a long time.

The leaf had gone thin as silk and pale with age. It could have been swept away and lost with no one noticing.

Instead it lay there holding a season inside it, as if autumn had been pressed between the pages and forgotten on purpose.

She slipped it back where she found it. Some things do not need to belong to you before they can stay with you.`,
      },
      bloom: {
        shortText: 'When petals covered the yard, even falling looked almost festive.',
        story: `One spring the flowers dropped so heavily that the whole yard looked as though it had been covered with carelessly scattered paper.

At first she meant to sweep at once. Then she stood still and watched the colors gather in the corners, bright even in their falling.

Loss can be untidy, she thought, but not always ugly.

She left the petals there for the afternoon, letting the yard keep its temporary softness a little longer.`,
      },
      fullBloom: {
        shortText: 'Her garden diaries kept dried petals the way memory keeps seasons.',
        story: `By then her garden diaries filled half a cabinet.

Between the pages were pressed petals from different years, each one thin and nearly weightless. Looking at them, she no longer tried to remember exact dates. She remembered weather, voices, a particular afternoon light.

The petals had lost their scent long ago. Some had lost part of their shape. But each still held enough color to reopen a moment.

Memory, she thought, is not always a complete flower. Sometimes a petal is enough.`,
      },
    },
  },
  'small-stone': {
    name: 'Small Stone',
    description: 'A road appears one step at a time.',
    tiers: {
      sprout: {
        shortText: 'She liked stones because they were the kind of companion that did not run away.',
        story: `As a child, her pockets were always full of stones.

She liked their weight. She liked that they stayed where they were placed. In a world where insects flew off, petals blew away, and adults were often busy, stones felt reliable.

She lined them on windowsills, along steps, and beside flowerpots, turning them into small maps only she understood.

Perhaps that was the beginning of it: learning that steadiness can be a kind of comfort.`,
      },
      leaf: {
        shortText: 'Roads are not found all at once. They are laid down by repeated steps.',
        story: `In the years when she first lived away from home, she helped repair a stretch of road.

It was tiring work. Stone after stone, the path changed so slowly that from one hour to the next it barely seemed different at all.

But when she turned back and looked from farther away, a line had appeared where before there had only been mud and uncertainty.

That stayed with her. Some roads are not discovered. They are made, patiently, underfoot.`,
      },
      bloom: {
        shortText: 'In her own yard, she laid a path the same way she had learned to live: one piece at a time.',
        story: `When she finally had a yard of her own, she decided to pave a little stone path through it.

She did not begin with a grand design. She set one stone, then another, adjusting distances, kneeling, standing, changing her mind. The work was slower than she had imagined and more satisfying too.

The path looked modest when it was finished. Yet every visitor used it at once, as if it had always belonged there.

She smiled at that. The things built slowly often seem the most natural in the end.`,
      },
      fullBloom: {
        shortText: 'After many years, the path kept the shape of every life that had crossed it.',
        story: `That stone path lasted for years.

Rain darkened it. Sun bleached it. Feet polished some stones smooth and left others rough. Children ran across it; older people crossed it more carefully. Everyone left a slightly different trace.

Eventually the path no longer looked newly made. It looked lived in.

She came to think that memory is like that too: not a single shining monument, but a route worn into being by return.`,
      },
    },
  },
  butterfly: {
    name: 'Butterfly',
    description: 'Some things cannot be caught. They can only be awaited.',
    tiers: {
      sprout: {
        shortText: 'She learned early that waiting often sees more than chasing.',
        story: `When she was little, she wanted badly to catch a butterfly.

She ran after one through the yard until she was breathless, arms out, absolutely certain that effort alone should be enough. It never was. The butterfly always rose just ahead of her hand.

At last she stopped from sheer exhaustion. And once she stopped, the butterfly returned to the flowers and became visible again.

That may have been the first time she understood that some beautiful things come closer only after you stop trying to seize them.`,
      },
      leaf: {
        shortText: 'The butterfly in the graduation photo mattered more because no one could stage it.',
        story: `On the day she left school, everyone gathered for a photograph.

People fixed collars, rearranged shoulders, and tried to look composed. But when the picture came back, the first thing everyone noticed was not a face. It was the butterfly paused near the edge of the frame.

Someone laughed and said the photo would have been ordinary without it.

She secretly agreed. Some moments become unforgettable for reasons no one can arrange.`,
      },
      bloom: {
        shortText: 'Fear softened the day a butterfly rested on a sleeve and stayed.',
        story: `The child had always been afraid of bugs.

Then one afternoon in the garden, a butterfly landed on a sleeve and stayed there longer than expected. No sudden flutter, no panic, no sharp little collision of wings. Just a quiet pause.

The child froze first, then slowly relaxed.

She watched the fear loosen in real time and thought: sometimes courage is not loud at all. Sometimes it is simply staying still long enough for gentleness to be believed.`,
      },
      fullBloom: {
        shortText: 'Nothing in the garden belonged to her, yet some things kept returning.',
        story: `Now there were butterflies everywhere in the garden.

None of them belonged to her. She could not name where each one came from or where each one went. Still, some returned often enough to feel familiar.

She liked that kind of closeness—the kind that does not require ownership.

Not everything dear must be held. Some things are dear precisely because they remain free and come back anyway.`,
      },
    },
  },
  pinwheel: {
    name: 'Pinwheel',
    description: 'The same wind turns things in different ways.',
    tiers: {
      sprout: {
        shortText: 'The first pinwheels fell apart quickly, but she remembered how eagerly they turned.',
        story: `Her father used to make pinwheels from old paper.

One sheet, a few folds, a thin bamboo stick, a tiny nail—and in ten minutes it was done. She would run with the finished pinwheel through the yard until the wind could no longer keep up.

The first one broke almost immediately. Then another. Then another.

Her father laughed, and still kept making them. In the end, the last pinwheel she saved did not go outside at all. She hung it by her bed and let it turn only in the small indoor drafts.`,
      },
      leaf: {
        shortText: 'A great windmill at the crossroads taught her that turning can also be patient.',
        story: `At the place she first lived away from home, there was a large windmill by the road.

When the wind came, it turned slowly and pulled the millstone with it. It creaked once per rotation, then once again, as if the whole structure were speaking in measured breaths.

It was nothing like a toy pinwheel. It felt more like an old craftsperson who did not waste words.

Later, when the old blades were removed, she kept a small broken piece in the crack of the toolshed wall. A reminder that change can be slow and still be real.`,
      },
      bloom: {
        shortText: 'The crooked handmade pinwheel turned slowly, but it turned with conviction.',
        story: `One year a child wanted a bright pinwheel from the street market.

It spun beautifully for one afternoon, then came home with a bent blade and no will to turn. The next day they decided to make one themselves with cardboard, glue, and wire.

The red paper went on backward. The green paper was cut unevenly. They had meant to make six blades and ended with four usable ones.

When it was finished, the pinwheel stood crooked with remarkable confidence. It spun slowly and made a soft flapping sound, as if to say: I can turn. I simply refuse to rush.`,
      },
      fullBloom: {
        shortText: 'The same wind passed through them all, and every pinwheel answered differently.',
        story: `Later a whole row of pinwheels hung from the garden fence.

One afternoon a little girl leaned close and blew at the nearest one. The first spun twice, the second shivered, and the third only moved after a thoughtful pause. It looked as though the wind were passing a half-finished sentence from one to the next.

She stood beside the fence watching them and suddenly understood something simple.

Change is not always dramatic. Sometimes it is only this: the same wind arrives, and each pinwheel turns in its own way.`,
      },
    },
  },
  firefly: {
    name: 'Firefly',
    description: 'Night is not only darkness.',
    tiers: {
      sprout: {
        shortText: 'She once thought a firefly was a star that had fallen low enough to greet her.',
        story: `The first time she saw a firefly, she thought a star had fallen from the sky.

It blinked in the dark grass once, then again, never staying long enough to be certain of. She reached toward it, but it did not land. It only lit up briefly, as if saying that a single flash could be enough.

That was all.

Yet she remembered it for years, proof that even a very small light can arrive with the force of revelation.`,
      },
      leaf: {
        shortText: 'The fireflies did not teach her anything. They simply stayed near while she remembered.',
        story: `There was a period when she often studied late at night.

Outside the yard, a few fireflies moved slowly through the dark. Their light was nowhere near strong enough to illuminate a page, but it was enough to remind her that the world had not gone entirely still.

She whispered the lines she had been trying to memorise, and when she said them wrong, the fireflies offered no correction.

Later she thought that perhaps they had not helped her remember at all. They had only kept her company while remembering remained difficult.`,
      },
      bloom: {
        shortText: 'The child watched the lights come and go and learned that darkness can still be shared.',
        story: `One evening she brought a child into the garden to watch for fireflies.

The wind was light, the flowers were shadowed, and the blinking lights kept appearing and vanishing near the grass. The child followed one, lost it, found another, then stood still in the middle of the garden trying to take in all of them at once.

No one spoke much.

What stayed with her was not brightness, but companionship—the feeling that even in the dark, two people could be quietly present to the same small wonder.`,
      },
      fullBloom: {
        shortText: 'A trapped light dies quickly. A free one can visit, glow, and leave with grace.',
        story: `The first night the little girl saw fireflies, she ran to the toolshed for a glass jar and announced that she would catch two and keep them by her bed as a night-light.

She stopped her gently. Light inside a jar, she said, does not stay light for long.

So the girl sat on the grass instead. One firefly landed on the back of her hand, glowed three times, and flew away again—as politely as if it had come only to say, I was here. Goodbye.

The next morning they found a dead firefly in the grass. In daylight it looked small and dark, nothing like the night before. The girl understood then that some brightness can only survive while free.`,
      },
    },
  },
};

/**
 * 英文解锁条件覆盖
 * 只在 en-US 下启用；中文继续以 narratives.js 原文为准。
 */
const EN_UNLOCK_TEXT = {
  first_practice_walk: 'Complete your first practice session.',
  first_daily_training: 'Complete your first daily session.',
  try_higher_n: 'Try a higher memory distance.',
  seven_walks: 'Complete 7 training sessions.',
  streak_2: 'Return for 2 days in a row.',
  streak_5: 'Return for 5 days in a row.',
  stable_session: 'Complete one steady session.',
  streak_15: 'Return for 15 days in a row.',
  no_false_alarms: 'Finish a session with no false alarms.',
  no_response_lte_1: 'Finish with at most 1 missed response.',
  stable_higher_n: 'Complete a steady higher-N session.',
  self_chosen_challenge: 'Complete a self-chosen challenge.',
  correct_30: 'Make 30 correct responses.',
  correct_60: 'Make 60 correct responses.',
  stable_streak: 'Maintain a stable streak.',
  view_diary: 'Open Garden Diary.',
  walks_10: 'Complete 10 training sessions.',
  walks_30: 'Complete 30 training sessions.',
  walks_50: 'Complete 50 training sessions.',
  walks_100: 'Complete 100 training sessions.',
  streak_3: 'Return for 3 days in a row.',
  streak_5_answer: 'Answer on 5 consecutive days.',
  try_different_modes: 'Try different training modes.',
  multi_mode_stable: 'Stay consistent across multiple modes.',
  use_1_mode: 'Use 1 training mode.',
  use_2_modes: 'Use 2 training modes.',
  use_3_modes: 'Use 3 training modes.',
  custom_rhythm: 'Use a custom training setup.',
  evening_or_quiet: 'Complete an evening or quiet session.',
  streak_7: 'Return for 7 days in a row.',
  hard_then_complete: 'Finish a hard session.',
  streak_30: 'Return for 30 days in a row.',
};

/**
 * 按语言返回某个收藏品的展示覆盖
 * @param {string} collectibleId
 * @param {string} lang
 * @returns {Object|null}
 */
function getNarrativeOverride(collectibleId, lang) {
  if (lang !== 'en-US') return null;
  return EN_NARRATIVE_OVERRIDES[collectibleId] || null;
}

/**
 * 本地化单个收藏品对象
 * 只覆盖展示字段，不影响解锁结构或图标等业务字段。
 * @param {Object} collectible
 * @param {string} [lang]
 * @returns {Object}
 */
function localizeCollectible(collectible, lang = i18n.language) {
  const override = getNarrativeOverride(collectible.id, lang);
  if (!override) return collectible;

  return {
    ...collectible,
    name: override.name || collectible.name,
    description: override.description || collectible.description,
    tiers: collectible.tiers.map((tier) => {
      const tierOverride = override.tiers?.[tier.tierId] || {};
      return {
        ...tier,
        unlockConditionText: EN_UNLOCK_TEXT[tier.unlockKey] || tier.unlockConditionText,
        shortText: tierOverride.shortText || tier.shortText,
        story: tierOverride.story || tier.story,
      };
    }),
  };
}

/**
 * 获取按当前语言本地化后的收藏品列表
 * @param {string} [lang]
 * @returns {Array}
 */
export function getLocalizedNarrativeCollectibles(lang = i18n.language) {
  return NARRATIVE_COLLECTIBLES.map((collectible) => localizeCollectible(collectible, lang));
}

// ═══════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════

/**
 * 根据 ID 获取收藏品定义
 * @param {string} id - 收藏品 ID
 * @param {string} [lang] - 语言代码，默认当前 i18n 语言
 * @returns {Object|undefined}
 */
export function getCollectibleById(id, lang = i18n.language) {
  const collectible = NARRATIVE_COLLECTIBLES.find((c) => c.id === id);
  return collectible ? localizeCollectible(collectible, lang) : undefined;
}

/**
 * 根据收藏品 ID 和品质 ID 获取品质详情
 * @param {string} collectibleId - 收藏品 ID
 * @param {string} tierId - 品质 ID (sprout/leaf/bloom/fullBloom)
 * @returns {Object|undefined}
 */
/**
 * 降级对象：当 ID 不存在时返回，避免调用方因 undefined 崩溃（R9）
 * @type {{ tier: string, tierId: string, tierName: string, shortText: string, story: string, diaryFragments: string[], unlockKey: string, unlockConditionText: string }}
 */
const FALLBACK_TIER = {
  tier: 'legacy',
  tierId: 'legacy',
  tierName: '???',
  shortText: '（内容已更新）',
  story: '',
  diaryFragments: [],
  unlockKey: '',
  unlockConditionText: '',
};

/**
 * 根据收藏品 ID 和品质 ID 获取品质详情
 * R9: ID 不存在时返回降级对象，不抛出异常
 *
 * @param {string} collectibleId - 收藏品 ID
 * @param {string} tierId - 品质 ID (sprout/leaf/bloom/fullBloom)
 * @param {string} [lang] - 语言代码，默认当前 i18n 语言
 * @returns {Object} 品质详情或降级对象
 */
export function getNarrativeTier(collectibleId, tierId, lang = i18n.language) {
  const collectible = getCollectibleById(collectibleId, lang);
  if (!collectible) return FALLBACK_TIER;
  return collectible.tiers.find((t) => t.tierId === tierId) || FALLBACK_TIER;
}

/**
 * 获取所有品质的扁平列表
 * @param {string} [lang] - 语言代码，默认当前 i18n 语言
 * @returns {Array<{collectibleId, collectibleName, collectibleIcon, ...tier}>}
 */
export function getAllNarrativeTiers(lang = i18n.language) {
  const result = [];
  getLocalizedNarrativeCollectibles(lang).forEach((c) => {
    c.tiers.forEach((t) => {
      result.push({
        collectibleId: c.id,
        collectibleName: c.name,
        collectibleIcon: c.icon,
        ...t,
      });
    });
  });
  return result;
}

/**
 * 根据 unlockKey 查找品质详情
 * @param {string} unlockKey - 解锁键
 * @param {string} [lang] - 语言代码，默认当前 i18n 语言
 * @returns {Object|undefined}
 */
export function getTierByUnlockKey(unlockKey, lang = i18n.language) {
  for (const c of getLocalizedNarrativeCollectibles(lang)) {
    for (const t of c.tiers) {
      if (t.unlockKey === unlockKey) {
        return { collectibleId: c.id, collectibleName: c.name, collectibleIcon: c.icon, ...t };
      }
    }
  }
  return undefined;
}

/**
 * 获取指定品质的日记碎片列表
 * @param {string} collectibleId - 收藏品 ID
 * @param {string} tierId - 品质 ID
 * @param {string} [lang] - 语言代码，默认当前 i18n 语言
 * @returns {string[]}
 */
export function getDiaryFragments(collectibleId, tierId, lang = i18n.language) {
  const tier = getNarrativeTier(collectibleId, tierId, lang);
  return tier ? tier.diaryFragments : [];
}

/**
 * 获取所有 unlockKey 列表（用于校验和测试）
 * @returns {string[]}
 */
export function getAllUnlockKeys() {
  const keys = [];
  NARRATIVE_COLLECTIBLES.forEach((c) => {
    c.tiers.forEach((t) => {
      keys.push(t.unlockKey);
    });
  });
  return keys;
}

// ═══════════════════════════════════════
// 开发环境完整性校验
// ═══════════════════════════════════════

/**
 * 校验叙事数据完整性（开发环境调用）
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateNarratives() {
  const errors = [];

  // 1. 必须有 8 个收藏品
  if (NARRATIVE_COLLECTIBLES.length !== 8) {
    errors.push(`Expected 8 collectibles, got ${NARRATIVE_COLLECTIBLES.length}`);
  }

  // 2. 收藏品 ID 唯一
  const ids = NARRATIVE_COLLECTIBLES.map((c) => c.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    errors.push('Duplicate collectible IDs found');
  }

  // 3. 所有 unlockKey 唯一
  const allKeys = getAllUnlockKeys();
  const uniqueKeys = new Set(allKeys);
  if (uniqueKeys.size !== allKeys.length) {
    errors.push('Duplicate unlockKeys found');
  }

  // 4. 每个收藏品必须有 4 个品质
  const validTierIds = ['sprout', 'leaf', 'bloom', 'fullBloom'];
  NARRATIVE_COLLECTIBLES.forEach((c) => {
    if (c.tiers.length !== 4) {
      errors.push(`${c.id}: Expected 4 tiers, got ${c.tiers.length}`);
    }

    // 5. 每个品质必须有 shortText、story、diaryFragments
    c.tiers.forEach((t) => {
      if (!validTierIds.includes(t.tierId)) {
        errors.push(`${c.id}/${t.tierId}: Invalid tierId`);
      }
      if (!t.shortText || t.shortText.trim().length === 0) {
        errors.push(`${c.id}/${t.tierId}: Missing shortText`);
      }
      if (!t.story || t.story.trim().length === 0) {
        errors.push(`${c.id}/${t.tierId}: Missing story`);
      }
      if (!t.diaryFragments || t.diaryFragments.length < 2) {
        errors.push(`${c.id}/${t.tierId}: diaryFragments must have at least 2 items`);
      }
      if (!t.unlockKey) {
        errors.push(`${c.id}/${t.tierId}: Missing unlockKey`);
      }
    });
  });

  return { valid: errors.length === 0, errors };
}

// 开发环境自动校验
if (import.meta.env.DEV) {
  const result = validateNarratives();
  if (!result.valid) {
    console.error('[narratives] Validation failed:', result.errors);
  }
}
