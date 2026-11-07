window.I2VNotes = [
  {
    "timing": "0:00–0:15 | 15 seconds",
    "script": "Solidarity AI asks how communities can shape technologies that affect them. We bring that question to autonomous driving and explore what a reusable visualisation of a real junction could contribute.",
    "design": "沿用 11.6 的原横幅图和居中结构，替换为 Solidarity AI 的正式题目和作者。"
  },
  {
    "timing": "0:15–1:00 | 45 seconds",
    "script": "Robotaxis are entering everyday streets. Waymo offers driverless rides, and Tesla has added its Cybercab to its Robotaxi service. The IEA put the global robotaxi fleet at around eight thousand in 2025, more than double the previous year. A separate September 2026 estimate put the worldwide operating autonomous vehicle fleet at around ten thousand. Yet thirty-six per cent of respondents in a 31-country Ipsos survey said they would feel unsafe riding in a self-driving car. How are these vehicles assessed, and who can see the evidence?",
    "design": "用 Waymo Robotaxi 和 Tesla Cybercab 说明自动驾驶已上公共道路。2024 是按 IEA 的 2025 年数据和增幅推得的上限。2025 是 Robotaxi，2026 年 9 月是另一份在运营自动驾驶车队估算，口播按两个规模参照处理。"
  },
  {
    "timing": "1:00–2:00 | 60 seconds",
    "script": "Developers and test teams generate evidence about a vehicle. Authorities use evidence to decide how and where vehicles can operate. The people who share those roads live with the effects of those decisions. Their access to the evidence, practical ability to test, and opportunities to influence the process are more limited. We ask whether visualising the traffic situations in which these systems operate could help narrow this imbalance. We start with a junction.",
    "design": "人物和动画表达证据流向主管机构、准入决定影响道路使用者。以可视化的问题接到路口。"
  },
  {
    "timing": "2:00–3:15 | 75 seconds",
    "script": "To visualise how autonomous vehicles behave, we start at a junction. Traffic comes from several directions, vehicles turn, and pedestrians cross. These interactions make junctions important places to examine. They also have a practical advantage. Fixed roadside cameras keep observing the same site, so we can collect many different interactions over time. Look at the camera in yellow and the vehicle view in blue. A few elevated, oblique cameras give us a broad view of the junction. To see the scene as a vehicle would, we need to reconstruct it.",
    "design": "先指左侧车流、转向和行人交汇，说明路口为何值得观察。再指右侧固定相机，说明为何能从同一地点持续积累丰富互动，以及为何还需要做路侧到车端的重建。"
  },
  {
    "timing": "3:15–4:15 | 60 seconds",
    "script": "I2V-FOCAL starts with sparse roadside views. We reconstruct the road and surroundings as a reusable static 3D Gaussian scene. Moving vehicles are reconstructed separately and kept in an asset library with their states over time. Those two kinds of assets come together in scenario composition. We sample vehicle states, place them while accounting for collisions, and use physically based relighting. In this way, one capture can give us reusable assets for many vehicle-view scenarios.",
    "design": "沿原图还原四路稀疏输入、静态 3DGS、动态车辆资产与时间状态，最后接情境组合。"
  },
  {
    "timing": "4:15–4:45 | 30 seconds",
    "script": "These four fixed cameras observe the same junction at the same time. Each sees the traffic from a different position. Watch how vehicles move through the four views. This is the roadside capture I2V-FOCAL starts from. On the next slide, we can see what we built from it.",
    "design": "只有同一时刻的四路视频。用实际输入承接方法，翻页看输出。"
  },
  {
    "timing": "4:45–6:15 | 90 seconds",
    "script": "The figure on the left shows what the junction looks like from viewpoints around a vehicle. The upper clip on the right shows the reconstructed junction. Look at the two clips below it. In the traffic clip, watch the arrangement of the vehicles. In the lighting clip, watch the shadow beside the van. The road and surroundings stay in place while the scenario changes. That gives us a junction we can reuse. What if a newly released vehicle or driving system could run through that junction, with the public watching the same evaluation?",
    "design": "用上方重建说明同一个地点，下方分别指车辆布置和车旁阴影，说明什么可变、什么留在原位。用可复用路口接新车或算法入场和公众观看。"
  },
  {
    "timing": "6:15–7:10 | 55 seconds",
    "design": "三步流程图。新车或新算法发布，进入重建路口检验，公众一起看同一次检验和结果。两轮依次显示本情境通过和失败。",
    "script": "When a new vehicle or driving algorithm is released, it could be run in a challenging reconstructed junction. People could watch the same test together. In the first run the vehicle yields and completes the crossing. In the second it stops past the line while people are crossing. Making both outcomes visible gives the public a concrete basis to scrutinise how a new system is evaluated for road admission."
  },
  {
    "timing": "7:10–7:45 | 35 seconds",
    "design": "上方 I2V 车辆和轨迹资产分到三幅动态场景。三个人从同一资源出发，分别做不同的尝试。",
    "script": "People can also explore the junction themselves. These three participants start with the same vehicle and trajectory assets. One adds a minibus, one redraws a turn, and one tries a different time of day. When many people can make their own edits, they can come up with combinations that a test team might never have thought to try."
  },
  {
    "timing": "7:45–8:25 | 40 seconds",
    "design": "九幅情境同时播放，用人物、场景和对叉表达更多人的探索与检验。沿红线看失败情境怎样汇到公众反馈。",
    "script": "More participants bring more situations to test. Each check or cross shows the outcome for that individual situation. Follow the crosses to the right. Those are situations that evaluators can investigate. When people try something unexpected and uncover a problem, they can help shape what gets tested next."
  },
  {
    "timing": "8:25–9:00 | 35 seconds",
    "design": "回到第 3 页同一组人物和准入关系。新增两条连接，公众能看到检验结果，也能把失败情境反馈给评估团队。",
    "script": "This is the same decision process we saw at the beginning. Now people who use the roads can see how vehicles are tested and bring new cases back to the test teams. A city agency or public-interest cooperative could maintain the scene library and keep it accessible to residents and independent evaluators. That is how a shared visual environment could narrow the gap in who can see the evidence and who can shape the questions."
  },
  {
    "timing": "Untimed appendix",
    "design": "正文序号对应来源，网页条目可直接点击。",
    "script": "The original technical slides and clips show I2V-FOCAL research. The final illustrations depict proposed uses."
  }
];
