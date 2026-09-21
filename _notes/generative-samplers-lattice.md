---
title: "Three lines of generative models, and the one that samples Boltzmann"
title_zh: "生成式算法的三条线，以及用来做玻尔兹曼采样的那一条"
date: 2026-08-16
topic: ml-physics
description: <span class="en">A working map from generative-model lineages to lattice Boltzmann sampling, the three difficulties, the samplers we built, and why the next bottleneck is the operator basis inside the architecture.</span><span class="zh">从生成式算法的几条发展线收到格点上的玻尔兹曼采样：三个困难在场论里长什么样、我们改了什么，以及下一步为什么要从架构学到的算符基重新设计。</span>
---
<!--
  Math conventions on this site:
  * Display math: $$ ... $$
  * Inline math:  $...$  (escape underscores as \_ so Kramdown
    does not treat them as italic markers)
-->

<div class="en" markdown="1">

> Status: a working map written around four eprints. I will revise it when a claim here is overtaken by a paper I have actually read.

The argument of this note is linear. Generative models developed along a few distinct lines. The middle one is Boltzmann sampling: the density is known only up to $Z$. That line has three difficulties; on the lattice they have specific faces. The samplers we built — VAN, SPS, NHMC — are attempts to move those faces. Among the remaining costs, the expensive one is no longer only the Markov chain. It is the architecture: gauge-equivariant training is slow, so the next design step is to ask which operator bases a trained network actually uses, and to put those bases in by hand.

## Three lines, by what is given

I sort generative models by the object one is handed, not by the brand name of the network.

**Line 1 — samples, no density.** Images, text, recorded molecular snapshots. The job is to fit $p_{\mathrm{data}}$. Autoregressive models, VAEs, GANs, diffusion, and flow matching all live here. Quality is likelihood of data, or a perceptual proxy. There is no Boltzmann weight to be faithful to.

**Line 2 — an unnormalized density, often no samples.** This is the middle line, and the one used for physics. The target is

$$
\pi(x)=\frac{1}{Z}\,e^{-E(x)},\qquad Z=\int dx\,e^{-E(x)},
$$

with $E$ (or a lattice action $S$) known and $Z$ intractable. Boltzmann generators, reverse-KL normalizing flows, variational autoregressive networks, and path-space samplers belong here. Quality is not that the fields look right. It is that a named correction still represents $\pi$ after you close the notebook.

**Line 3 — a symmetry or a process law.** Gauge covariance, $Z_2$, permutation symmetry, or a prescribed SDE. The model is no longer free to use any function of the input. Equivariant flows, loop-force networks, and score models with a built-in process sit here. This line is not an alternative to Boltzmann sampling; it is the constraint that appears when line 2 is imposed on a field with symmetry. It is also where the architecture becomes expensive.

A paper can sit on more than one line. Diffusion trained on HMC configurations is line 1 pointed at a lattice. The same SDE trained only from $S[\phi]$ is line 2. A gauge-equivariant version of either is line 3 wrapped around them. The map is for placing the paper, not for ranking brands.

## The middle line: Boltzmann sampling

On line 2 the generative object is a **proposal** $q_\theta$, cheap to sample, together with enough density or path-probability information to correct it. That is the opposite of image generation. The unnormalized density is given; the job is to move probability mass without destroying correctness.

Training usually minimizes a reverse KL, which is available because $S$ is known:

$$
D_{\mathrm{KL}}(q_\theta\parallel\pi)=\mathbb{E}_{q_\theta}\bigl[\log q_\theta-\log\pi\bigr].
$$

Reverse KL is mode-seeking. A model that covers one phase, or one topological sector, can look excellent on the loss and still be unusable as an ensemble. So every construction I trust ends with a statistical correction: independent Metropolis–Hastings, self-normalized importance sampling, a Metropolis-adjusted local kernel on top of the neural proposal, or a path-space work weight. If the weights collapse or the acceptance vanishes, the proposal has failed. I treat that failure as evidence about $q_\theta$, not as a reason to drop the correction.

## Three difficulties, and their lattice faces

Boltzmann sampling is hard for three reasons that are older than neural nets. On the lattice they have specific faces.

**Critical slowing down.** Local, equilibrium Markov chains mix on the scale of the correlation length. Toward a second-order point — or, for an asymptotically free gauge theory, toward the continuum $\xi/a\to\infty$ — the integrated autocorrelation time grows as a power of $\xi/a$. You pay more and more trajectories for one independent configuration. In two-dimensional $\phi^4$, the finite-volume face of this is the pseudocritical strip: susceptibility peaks, the magnetization distribution becomes hard, and HMC's $\tau_{\mathrm{int}}$ rises.

**Topological freezing.** In gauge theories the same slowing down often appears as a stuck topological charge $Q$. The chain is then not ergodic. Observables that couple to topology are biased in a way that is easy to miss if one only looks at local correlators. Scalar $\phi^4$ has a cheaper analogue: $Z_2$ sector collapse, where a reverse-KL model sits in one broken-phase well and never sees the other.

**The sign problem.** If $S$ is complex, $e^{-S}$ is not a probability. Finite-density QCD, real-time evolution, and a $\theta$-term are this door. Almost none of the generative constructions below, as they are usually trained, address it. Treating a complex weight as if it were a Boltzmann factor is a different problem. I keep it on the list so the map does not pretend the three difficulties are equally open.

A method is interesting only if it changes one of those three costs, or gives a controlled estimator of $Z$ itself.

## What we changed on that line

The three samplers below are all line-2 objects: data-free proposals for an unnormalized Boltzmann density, plus a named correction. They differ by what is learned.

**VAN — factorize, then correct locally.**
With Shiyang Chen, [arXiv:2512.19575](https://arxiv.org/abs/2512.19575) extends variational autoregressive networks from discrete spins to continuous $\phi^4$. The joint is written as a chain of conditionals, $q_\theta(\phi)=\prod_i q_\theta(\phi_i\mid\phi_{<i})$, and trained from the action alone by a REINFORCE-style variational free energy. That is the local face of line 2: generation looks like a single-site sweep, which is why we expected it to avoid some of the mode-covering failures of a single global map.

The learned $q_\theta$ is not $\pi$. Single-site and block Metropolis–Hastings updates on top of the VAN proposal remove the residual bias we saw in pure VAN sampling, while the effective sample size stays high in the range we studied. Transfer learning is the other practical move: the KL between the magnetization distribution and a Gaussian reference tracks how hard a $(\kappa,L)$ point is, and fine-tuning a model pretrained at one $\kappa$ is cheaper than training from a Gaussian field. On Ising and on $\phi^4$ up to $L=10$, $\kappa\in[0.20,0.30]$, the corrected ensembles agree with standard Monte Carlo within errors, and we do not see clear critical slowing down *in that window*. That is not a continuum-limit claim.

**SPS — learn the path, then correct on path space.**
With Chen, Aarts, Lucini, and Zhou, [arXiv:2606.13790](https://arxiv.org/abs/2606.13790) changes the learned object. Instead of an endpoint density, SPS learns forward and backward stochastic dynamics between a Gaussian prior and the Boltzmann target, and trains by lowering the path-space irreversibility — the KL between the two trajectory measures, equivalently an entropy-production bound. No HMC configurations are used. After training, an extended-space independence Metropolis–Hastings step restores exactness, provided the proposal covers the support.

On two-dimensional $\phi^4$ with the $L\times 8$ finite-temperature geometry, SPS matches HMC on magnetization, susceptibility, and the free-energy estimator through the pseudocritical region, up to $L=64$, with a much shorter autocorrelation than HMC. Uncorrected SPS already sits close to HMC on those observables; IMH is there because closeness is not exactness. This is a 2d scalar result. It is a stochastic-quantization-inspired route to a data-free proposal, not a 4d gauge sampler.

<figure>
  <img src="{{ '/assets/img/publication_story/sps-path-balance.png' | relative_url }}" alt="SPS forward and backward path measures between a prior and the Boltzmann target">
  <figcaption>SPS. Learnable forward and backward path measures connect a known prior to the Boltzmann target. Trajectory-level balance is the training principle; IMH is the correction.</figcaption>
</figure>

**NHMC — keep the path correction, change the process to a Hamiltonian path.**
[arXiv:2607.15682](https://arxiv.org/abs/2607.15682) is the Hamiltonian version of the same train-then-correct idea. The proposal is a stochastic Hamiltonian-style path: draw a learned conditional momentum, apply a reversible volume-preserving kick–drift map, record the forward and reverse path probabilities. The log ratio is a dimensionless generalized work $W_\theta$. During training, its mean is a path-space KL. After training, the same $W_\theta$ is the weight for path-SNIS, the acceptance for path-IMH, and the correction inside a proved shared-bridge round-trip Metropolis kernel that acts on configurations and leaves $\pi$ invariant.

On double-well and finite-volume $\phi^4$ targets the corrected estimates are good when path overlap is sufficient. When overlap is poor, weight degeneracy, low acceptance, and long autocorrelation *are* the result: they expose proposal failure instead of hiding it. The molecular internal-coordinate study and the compact $U(1)$ round-trip sit in the paper as feasibility boundaries, not as completed applications.

<figure>
  <img src="{{ '/assets/img/publication_story/nhmc-method-overview.png' | relative_url }}" alt="NHMC learned stochastic Hamiltonian path and four correction routes">
  <figcaption>NHMC. A learned stochastic Hamiltonian path records work. The same number trains the proposal and then supports path-SNIS, free-energy estimation, path-IMH, and round-trip NHMC-MH.</figcaption>
</figure>

Taken together, the three papers move different faces of the same difficulty. VAN attacks mixing by a local, factorized proposal plus a cheap MH polish, and attacks parameter scans by transfer. SPS and NHMC attack global transport: they learn a process whose path probability is recorded, so the correction does not need an endpoint Jacobian. None of them claims to have opened the sign-problem door. None of them is 4d $SU(3)$ at fine $a$.

## The architecture problem, and why I started reading bases

Among those improvements a different cost showed up. To put line 3 into line 2 — to respect gauge covariance, or even $Z_2$, at the level of the function space — the standard move is an equivariant network. That is the right kinematic constraint. It is also slow. Gauge-equivariant coupling layers and loop-valued convolutions are large, their Jacobians or score maps are expensive, and a full equivariant retrain is a poor way to search for a better inductive bias. I wanted a cheaper question: after a network has been trained, **which operator bases does the trained field actually use?**

That is [operator spectroscopy](https://arxiv.org/abs/2605.11199), arXiv:2605.11199. The object of study is no longer the ensemble. It is the trained field-space function itself — a flow-matching velocity, a diffusion score, or a normalizing-flow action residual $\Delta S_q=-\log q_\theta-S-C$. Project it onto a dictionary fixed *before* the fit, chosen from symmetry, exact Gaussian path limits, finite-volume modes, and gauge covariance:

$$
\mathcal{T}_\theta(\tau,\phi)=\sum_n c_n(\tau)\,\mathcal{O}_n[\phi]+r_\theta(\tau,\phi).
$$

A sector is kept only if it lowers the held-out residual, moves the observable it is supposed to move, and is not reproduced by wrong-parity, shuffled, or random controls.

The $\phi^4$ result is the one that changed how I think about architecture. A trained straight-flow teacher is **not** described by a local force basis alone. After the local transport piece, the residual splits into two infrared channels: a deflated zero-mode polynomial $P_5(M;t)$ that carries the Binder tail, and the lowest nonzero Fourier shell $\phi^\perp_{\lvert n\rvert^2=1}$ that carries the finite-$k$ correlator. They are essentially orthogonal at $L=8$. Wrong-parity zero modes and random Fourier directions do not fake the same reductions. So a network that only spends capacity on a local stencil is paying for the wrong function space, and a fully equivariant giant net may be paying for a much larger space than the trained dynamics ever uses.

The same projection reads other failures. A collapsed reverse-KL flow shows a forbidden odd zero-mode term in $\Delta S_q$ — the operator signature of a spurious magnetic field — with the odd-block $R^2$ dropping from $0.865$ to below $10^{-3}$ once $Z_2$ is imposed. A variance-exploding diffusion teacher follows the force-resolvent ordering predicted by the free theory, which is a different leading basis from flow matching; the distinction is path-selected, not architectural. For gauge-equivariant teachers the scalar dictionary is replaced by Lie-algebra-valued loop forces. Wilson-loop-force operators lower the tangent-field residual; raw links, shuffled loops, and random controls do not. Equivariance fixes the kinematic space. The projection says which covariant directions the trained dynamics actually occupy.

That is the design loop I want next. Do not start from a larger equivariant U-Net. Start from the retained sectors — local transport, a short zero-mode tower, the lowest soft shell, a small set of loop forces — and build a network whose layers *are* those bases, with a handful of learned coefficients along the probability path. Training should be faster because the function space is the one the teacher already chose. Sampling should be better because the infrared pieces that local force misses, and that full equivariance buries inside hundreds of thousands of weights, sit in the architecture on purpose.

The spectroscopy paper is the diagnostic, not the new sampler. VAN, SPS, and NHMC are the line-2 machines. The next architecture is the attempt to stop paying the line-3 tax in full.

## What I am not claiming

Two-dimensional $\phi^4$ and a compact $U(1)$ pilot are not 4d $SU(3)$. A shorter autocorrelation on an $L\times 8$ strip is not the continuum limit. An operator basis that is stable across a $\kappa$ sweep is not yet a trained sampler with that basis hard-wired. The sign problem is still a different door.

If a later architecture built from these sectors trains faster and samples better, that will be a separate note, with the same correction law as above.

</div>

<div class="zh" markdown="1">

> 状态：围着四篇 eprint 写的工作地图。哪一条被我读过的新论文推翻，我会改。

这篇的逻辑是一条直线。生成式算法的发展可以分成几条线；中间那条是玻尔兹曼采样——密度只差一个 $Z$。这条线有三个困难，落到格点场论上各有具体的脸。VAN、SPS、NHMC 是对着这些脸做的改动。改完之后，贵的不再只是 Markov 链，而是架构：等变训练太慢，所以下一步要问训练后的网络到底用了哪些算符基，再把这些基写进新的结构里。

## 三条线，按手里有什么分

我不按网络的品牌名分类，按你被交给的对象分。

**第一条：有样本，没有密度。** 图像、文本、分子构象数据库。任务是拟合 $p_{\mathrm{data}}$。自回归、VAE、GAN、扩散、flow matching 都在这里。好坏看数据似然，或某种感知代理。没有必须忠于的 Boltzmann 权重。

**第二条：有未归一密度，常常没有样本。** 这是中间那条，也是物理用的那条。目标是

$$
\pi(x)=\frac{1}{Z}\,e^{-E(x)},\qquad Z=\int dx\,e^{-E(x)},
$$

能量 $E$（或格点作用量 $S$）已知，$Z$ 算不动。Boltzmann generator、反向 KL 的 normalizing flow、变分自回归网络、路径空间采样器，都在这里。好坏不是场好看，而是合上笔记本之后，具名修正仍然代表 $\pi$。

**第三条：有对称性，或有过程方程。** 规范协变、$Z_2$、置换对称，或一条规定好的 SDE。模型不能再是输入的任意函数。等变 flow、环力网络、带过程约束的 score 模型在这里。它不是玻尔兹曼采样的替代品，而是第二条落到带对称的场上时出现的约束，也是架构开始变贵的地方。

一篇文章可以同时占几条。用 HMC 组态训练的扩散是第一条指向格子；同一条 SDE 只从 $S[\phi]$ 训练，是第二条；再做成规范等变，就是第三条包在外面。地图用来放文章，不是用来排品牌。

## 中间这条：玻尔兹曼采样

在第二条上，生成对象是一个便宜出样的 **提议** $q_\theta$，外加足够的密度或路径概率信息，好做修正。这和生成图像相反：未归一密度是已知的，任务是移动概率质量，同时不毁掉正确性。

训练通常最小化反向 KL，因为 $S$ 已知，这个量写得出来：

$$
D_{\mathrm{KL}}(q_\theta\parallel\pi)=\mathbb{E}_{q_\theta}\bigl[\log q_\theta-\log\pi\bigr].
$$

反向 KL 会追模态。模型只盖住一个相、或一个拓扑扇区，loss 可以很好看，系综仍然不能用。所以我信任的构造最后都有统计修正：独立 Metropolis–Hastings、自归一化重要抽样、在神经提议上再叠一层 Metropolis 调整的局域核，或路径上的功权重。权崩溃、接受率掉光，说明提议失败了。我把这种失败当成关于 $q_\theta$ 的证据，不是丢掉修正的理由。

## 三个困难，在格点上长什么样

玻尔兹曼采样的难处比神经网络老。落到格点上，各有一张具体的脸。

**临界慢化。** 局域、平衡的 Markov 链在关联长度的尺度上混合。靠近二阶点——对渐近自由的规范理论，也就是靠近连续极限 $\xi/a\to\infty$——积分自相关时间随 $\xi/a$ 的幂次涨。一条独立组态要越来越多的轨迹。二维 $\phi^4$ 上，有限体积的这张脸是赝临界带：磁化率出峰，磁化强度分布变硬，HMC 的 $\tau_{\mathrm{int}}$ 抬头。

**拓扑冻结。** 在规范理论里，同一种变慢常常表现为拓扑荷 $Q$ 卡死。链不再遍历。和拓扑耦合的观测量会偏，而且只看局域关联时很容易漏掉。标量 $\phi^4$ 有一个更便宜的同类物：$Z_2$ 扇区崩溃——反向 KL 的模型坐在破缺相的一口井里，看不见另一口。

**符号问题。** $S$ 若是复的，$e^{-S}$ 就不是概率。有限密度 QCD、实时演化、$\theta$ 项，都是这扇门。下面这些生成式构造，按它们通常的训练方式，几乎都不碰它。把复权重当成 Boltzmann 因子，是另一道题。列在这里，是避免这张地图假装三个困难一样敞开。

一种方法有意思，只当它改掉了上述三种代价之一，或给出受控的 $Z$ 估计。

## 我们在这条线上改了什么

下面三个采样器都是第二条上的对象：对着未归一 Boltzmann 密度的无数据提议，加上具名修正。差别在学的是什么。

**VAN —— 先分解，再局域修正。**
和陈世洋合作的 [arXiv:2512.19575](https://arxiv.org/abs/2512.19575) 把变分自回归网络从离散自旋做到连续 $\phi^4$。联合分布写成条件链 $q_\theta(\phi)=\prod_i q_\theta(\phi_i\mid\phi_{<i})$，只用作用量、用类 REINFORCE 的变分自由能训练。这是第二条的局域面孔：生成看起来像单点扫描，所以我们预期它能避开一张全局映射在盖模态时的一部分失败。

学到的 $q_\theta$ 不是 $\pi$。在 VAN 提议之上叠单点或块 Metropolis–Hastings，能去掉纯 VAN 抽样里看到的残余偏差，同时在我们看过的参数范围内保持高 ESS。另一件实际的事是迁移：磁化强度分布相对高斯参考的 KL，能标出某个 $(\kappa,L)$ 有多难；在一个 $\kappa$ 上预训练再微调，比从高斯场重训便宜。Ising 和 $\phi^4$ 做到 $L=10$、$\kappa\in[0.20,0.30]$，修正后的系综和标准 Monte Carlo 在误差内一致，*在这个窗口里*没有看到清楚的临界慢化。这不是连续极限的声明。

**SPS —— 学路径，在路径空间上修正。**
和陈世洋、Aarts、Lucini、周凯合作的 [arXiv:2606.13790](https://arxiv.org/abs/2606.13790) 换了学习对象。不再学终点密度，而是在高斯先验和 Boltzmann 目标之间学习前向 / 后向随机动力学，用降低路径空间不可逆性来训练——两条轨迹测度之间的 KL，也就是熵产生的上界。不用 HMC 组态。训练之后，扩展空间上的独立 Metropolis–Hastings 恢复精确性，前提是提议盖住支集。

在二维 $\phi^4$ 的 $L\times 8$ 有限温度几何上，SPS 在赝临界区把磁化强度、磁化率和自由能估计做到和 HMC 一致，体积收到 $L=64$，自相关比 HMC 短得多。未修正的 SPS 在这些观测量上已经贴近 HMC；加 IMH，是因为贴近不是精确。这是二维标量的结果。它是一条受随机量子化启发的、无数据提议路线，不是四维规范采样器。

<figure>
  <img src="{{ '/assets/img/publication_story/sps-path-balance.png' | relative_url }}" alt="SPS 在先验与 Boltzmann 目标之间的前向与后向路径测度">
  <figcaption>SPS。可学习的前向与后向路径测度连接已知先验和 Boltzmann 目标。训练原则是轨迹层面的平衡，修正是 IMH。</figcaption>
</figure>

**NHMC —— 保留路径修正，把过程换成 Hamiltonian 路径。**
[arXiv:2607.15682](https://arxiv.org/abs/2607.15682) 是同一个「先训练、再修正」想法的 Hamiltonian 版本。提议是一条随机 Hamiltonian 风格的路径：抽一个学来的条件动量，做可逆、保体积的 kick–drift，记下前向和反向的路径概率。对数比是无量纲的广义功 $W_\theta$。训练时，它的均值就是路径空间 KL；训练之后，同一个 $W_\theta$ 是 path-SNIS 的权重、path-IMH 的接受率，也是一条被证明的、作用在组态上并保持 $\pi$ 不变的共享桥接点往返 Metropolis 核里的修正。

在双阱和有限体积 $\phi^4$ 上，路径重叠足够时，修正后的估计是好的。重叠不够时，权退化、接受率低、自相关长，*本身就是结果*：它们把提议失败暴露出来，而不是藏起来。分子内坐标研究和紧致 $U(1)$ 往返核，在文中标的是可行性边界，不是做完的应用。

<figure>
  <img src="{{ '/assets/img/publication_story/nhmc-method-overview.png' | relative_url }}" alt="NHMC 的随机 Hamiltonian 路径与四条修正路线">
  <figcaption>NHMC。可学习的随机 Hamiltonian 路径记下功。同一个量既训练提议，也支撑 path-SNIS、自由能估计、path-IMH 和 round-trip NHMC-MH。</figcaption>
</figure>

三篇合在一起，动的是同一个困难的不同面孔。VAN 用分解提议加便宜的 MH 抛光来混合，用迁移来扫参数。SPS 和 NHMC 做全局输运：学一条能记下路径概率的过程，修正不再需要终点处的 Jacobian。没有一篇声称打开了符号问题那扇门，也没有一篇是细格距上的四维 $SU(3)$。

## 架构问题，以及为什么开始读基

这些改进里冒出了另一种代价。要把第三条写进第二条——在函数空间的层面尊重规范协变，哪怕只是 $Z_2$——标准做法是等变网络。运动学约束是对的，但慢。规范等变的 coupling layer 和取值在环上的卷积都很大，Jacobian 或 score 很贵，用一次完整的等变重训去搜归纳偏置，不划算。我想问一个更便宜的问题：网络训练完之后，**训练后的场到底用了哪些算符基？**

这就是 [算符谱学](https://arxiv.org/abs/2605.11199)，arXiv:2605.11199。研究对象不再是系综，而是训练后的场空间函数本身——flow matching 的速度、扩散的 score，或 normalizing flow 的作用量残差 $\Delta S_q=-\log q_\theta-S-C$。把它投影到 *拟合之前* 就固定好的字典上，字典来自对称性、精确的高斯路径极限、有限体积模态和规范协变：

$$
\mathcal{T}_\theta(\tau,\phi)=\sum_n c_n(\tau)\,\mathcal{O}_n[\phi]+r_\theta(\tau,\phi).
$$

一个扇区被留下，只当它降低 held-out 残差、推动它该推动的观测量，并且不能被错误宇称、打乱的或随机的对照复制。

改变我看法的是 $\phi^4$ 上的结果。训练好的直线 flow teacher **不能**只用局域力基来描述。去掉局域输运之后，残差裂成两条红外通道：承载 Binder 尾巴的消元零模多项式 $P_5(M;t)$，以及承载有限 $k$ 关联的最低非零傅里叶壳层 $\phi^\perp_{\lvert n\rvert^2=1}$。在 $L=8$ 上它们几乎正交。错误宇称的零模和随机傅里叶方向，仿不出同样的下降。所以，只在局域模板上花钱的网络，买的是错的函数空间；而一个巨大的全等变网络，可能买了一个训练动力学根本用不满的空间。

同一套投影也读其他失败。崩溃的反向 KL flow 会在 $\Delta S_q$ 里留下不该出现的奇零模项——假磁场所对应的算符——一旦加上 $Z_2$，奇块的 $R^2$ 从 $0.865$ 掉到 $10^{-3}$ 以下。方差膨胀的扩散 teacher 走的是自由理论预言的力–预解阶，和 flow matching 的领先基不同；这个差别是路径选的，不是架构选的。对规范等变的 teacher，标量字典换成取值在李代数上的环力。Wilson 环力算符降低切场残差；裸链接、打乱的环、随机对照都不降。等变固定的是运动学空间。投影说的是，训练后的动力学实际占了哪些协变方向。

我想做的下一步就是这个设计闭环。不要先上一个更大的等变 U-Net。从留下来的扇区出发——局域输运、一小截零模塔、最低的软壳层、一小撮环力——做一层层 *就是* 这些基的网络，沿概率路径只留少量可学习系数。训练应当更快，因为函数空间是 teacher 已经选过的那一个；采样应当更好，因为局域力漏掉的、全等变又埋进几十万权重里的红外部分，被故意写进了结构。

谱学论文是诊断，不是新的采样器。VAN、SPS、NHMC 是第二条上的机器。下一套架构，是试图不再把第三条的税全额付掉。

## 我没有在声称的事

二维 $\phi^4$ 和一次紧致 $U(1)$ 试点，不是四维 $SU(3)$。$L\times 8$ 长条上更短的自相关，不是连续极限。一条在 $\kappa$ 扫描上稳定的算符基，还不是把这条基写死之后训练出来的采样器。符号问题仍是另一扇门。

如果后来用这些扇区搭出来的架构真的训得更快、抽得更好，那会是另一篇笔记，修正纪律和上面相同。

</div>
