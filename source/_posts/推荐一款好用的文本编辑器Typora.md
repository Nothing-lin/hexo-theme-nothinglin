---
title: 推荐一款好用的文本编辑器Typora
index_img: /img/default.png
date: 2021-06-28 13:07:00
tags:
- Github
- 版本控制
categories: Github系列
author: nothinglin
eyeCatchImage: /img/default.png
---

# 介绍

通常一个分布式系统是由许多相互依赖的服务所组成的，这些被依赖的服务极易出现故障或响应延迟的问题。如果其中某个服务失败则会影响其他服务并进一步降低整体性能，并导致应用程序其他功能无法正常访问，在最坏的情况下，整个应用程序将崩溃。

Hystrix框架通过提供**熔断**和**降级**来控制服务之间的交互依赖，通过隔离故障服务并停止故障的级联效应以提高系统的总体弹性。

## Hystrix的历史

2011年Netflix API团队开发了Hystrix，2012年Hystrix不断发展和成熟，并且Netflix内的许多团队都采用了它。如今，每天在Netflix上通过Hystrix执行数以千亿计的线程隔离和数以千计的信号隔离调用。

## Hystrix的作用是什么？

- 为第三方客户端提供保护，控制延迟和失败（通常依赖网络）等故障。
- 停止复杂的分布式系统中的级联故障。
- 快速失败，迅速恢复。
- 回退并在可能的情况下正常降级。
- 启用近乎实时的监视，警报和配置控制。

## Hystrix解决什么问题？

复杂分布式体系结构中的应用程序具有数十种依赖关系，每种依赖关系不可避免地会在某个时刻失败（因为不可预知的故障）。如果应用程序未与这些外部故障隔离开来，那么外部的错误会影响到自己，以至于将自己拖垮。



### 当一切正常时，请求流如下所示：

[![img](https://tianmingxing.com/images/soa-1-640.png)](https://tianmingxing.com/images/soa-1-640.png)

当前请求依赖4个其它服务，并且这些服务工作正常，能够及时响应请求。

### 如果某个依赖服务出现故障，它可以阻止整个用户请求：

[![img](https://tianmingxing.com/images/soa-2-640.png)](https://tianmingxing.com/images/soa-2-640.png)

当依赖的某个服务出现故障，势必会影响到当前请求，例如出现故障的服务没有及时响应，请求它的时间达到了5秒，那么当前请求也会阻塞5秒。

### 随着高流量请求过来，上述问题会引起连锁效应，问题逐渐变得复杂起来：

[![img](https://tianmingxing.com/images/soa-3-640.png)](https://tianmingxing.com/images/soa-3-640.png)

由于WEB服务器资源是有限的，当慢请求越来越多时会造成资源等待，并加速空闲资源的消耗，直到耗尽所有资源，此时服务器已经不能响应新的正常请求，也就是服务彻底挂了。

## Hystrix的设计原则是什么？

- 防止任何单个依赖服务耗尽所有容器（例如Tomcat）的用户线程。
- 减少负载并快速失败，而不是排队等待。
- 在可行的情况下提供兜底，以保护用户免受故障的影响。
- 使用隔离技术（例如隔板，泳道和断路器模式）来限制任何一个依赖关系的影响。
- 通过近实时指标，监视和警报优化发现时间
- 通过在Hystrix中低延迟传播配置来优化服务恢复时间，并支持动态属性更改，通过低延迟反馈环路进行实时操作修改。
- 防止整个依赖项客户端执行失败，而不仅仅是网络传输失败。

# 原理

Hystrix使用隔板模式将依赖关系彼此隔离，并限制对其中任何一个的并发访问。

[![img](https://tianmingxing.com/images/soa-5-isolation-focused-640.png)](https://tianmingxing.com/images/soa-5-isolation-focused-640.png)

## 线程和线程池

客户端（库，网络调用等）在单独的线程上执行。这样可以将它们与调用线程（Tomcat线程池）隔离，以便调用者可以“摆脱”耗时太长时间的依赖项调用。

[![img](https://tianmingxing.com/images/request-example-with-latency-640.png)](https://tianmingxing.com/images/request-example-with-latency-640.png)

## 信号量

可以使用信号量（或计数器）而不是线程池/队列这种方式，这使Hystrix无需使用线程池就可以减轻负载，但它不支持超时和退出。如果你信任客户端，并且只希望减少负载，则可以使用这种方法。

`HystrixCommand`和`HystrixObservableCommand`在2个地方支持信号量：

- **Fallback：** Hystrix检索后备时，总是在调用Tomcat线程上进行。
- **Execution：** 如果将该属性设置为`execution.isolation.strategy=SEMAPHORE`则Hystrix将使用信号量而不是线程来限制调用该命令的父线程并发数量。

# 使用示例

要在Maven项目中使用Hystrix，我们需要在项目pom.xml中声明Netflix的hystrix-core和rxjava-core依赖项：

```
<dependency>
    <groupId>com.netflix.hystrix</groupId>
    <artifactId>hystrix-core</artifactId>
    <version>1.5.4</version>
</dependency>

<dependency>
    <groupId>com.netflix.rxjava</groupId>
    <artifactId>rxjava-core</artifactId>
    <version>0.20.7</version>
</dependency>
```

## 简单例子

隔离和包装对远程服务的调用，`run()`方法中即为原来调用的方法。

```
class CommandHelloWorld extends HystrixCommand<String> {
 
    private String name;
 
    CommandHelloWorld(String name) {
        super(HystrixCommandGroupKey.Factory.asKey("ExampleGroup"));
        this.name = name;
    }
 
    @Override
    protected String run() {
        return "Hello " + name + "!";
    }
}
```

然后修改原客户端中的调用为：`new CommandHelloWorld("Bob").execute(), equalTo("Hello Bob!")`。

## 模拟远程服务

在下面的示例中，类`RemoteServiceTestSimulator`表示某个远程服务器上的服务，通过睡眠模拟这个服务的耗时情况：

```
class RemoteServiceTestSimulator {
 
    private long wait;
 
    RemoteServiceTestSimulator(long wait) throws InterruptedException {
        this.wait = wait;
    }
 
    String execute() throws InterruptedException {
        Thread.sleep(wait);
        return "Success";
    }
}
```

使用`HystrixCommand`对上面的服务调用进行隔离，把它包装在的`run()`方法中。

```
class RemoteServiceTestCommand extends HystrixCommand<String> {
 
    private RemoteServiceTestSimulator remoteService;
 
    RemoteServiceTestCommand(Setter config, RemoteServiceTestSimulator remoteService) {
        super(config);
        this.remoteService = remoteService;
    }
 
    @Override
    protected String run() throws Exception {
        return remoteService.execute();
    }
}
```

然后修改原客户端中的调用为：

```
HystrixCommand.Setter config = HystrixCommand.Setter.withGroupKey(HystrixCommandGroupKey.Factory.asKey("RemoteServiceGroup2"));
     
new RemoteServiceTestCommand(config, new RemoteServiceTestSimulator(100)).execute();
```

## 防御性编程

### 超时

设置对远程服务的调用超时以达到快速失败并隔离故障的目的：

```
HystrixCommand.Setter config = HystrixCommand
.Setter
.withGroupKey(HystrixCommandGroupKey.Factory.asKey("RemoteServiceGroupTest4"));

HystrixCommandProperties.Setter commandProperties = HystrixCommandProperties.Setter();
//设置10秒超过，如果这个服务超过10秒还没有返回则熔断以保护系统更具响应性。
commandProperties.withExecutionTimeoutInMilliseconds(10_000);
config.andCommandPropertiesDefaults(commandProperties);

new RemoteServiceTestCommand(config, new RemoteServiceTestSimulator(500)).execute();
```

### 自定义线程池

当依赖的远程服务开始变慢时，应用程序仍然会继续调用该远程服务，该应用程序不知道远程服务是否正常，并且每次请求进入时都会产生新线程。我们不希望发生这种情况，因为我们需要这些线程来运行服务器上运行的其他远程服务调用或进程，并且我们还希望避免CPU使用率激增。

```
HystrixCommand.Setter config = HystrixCommand
.Setter
.withGroupKey(HystrixCommandGroupKey.Factory.asKey("RemoteServiceGroupThreadPool"));

HystrixCommandProperties.Setter commandProperties = HystrixCommandProperties.Setter();
commandProperties.withExecutionTimeoutInMilliseconds(10_000);
config.andCommandPropertiesDefaults(commandProperties);

config.andThreadPoolPropertiesDefaults(HystrixThreadPoolProperties.Setter()
.withMaxQueueSize(10)//线程等待队列大小
.withCoreSize(3)//核心线程大小，即线程池中始终保持活动状态的线程数。
.withQueueSizeRejectionThreshold(10));//线程等待队列达到多少是会进行拒绝，由于MaxQueueSize不能动态调整，所以这个参数的目的是为了动态调整拒绝队列大小，一般建议此值远大于MaxQueueSize。

new RemoteServiceTestCommand(config, new RemoteServiceTestSimulator(500)).execute();
```

具体的参数配置详见WIKI

### 短路断路器模式

让我们考虑远程服务开始失败的情况。

我们不想继续提出要求，浪费资源。理想情况下，我们希望在一定时间内停止发出请求，以便在恢复请求之前给服务时间恢复。这就是所谓的短路断路器模式。也就是给对方一个恢复时间，既然对方已经响应不过来了，那么我就停止发送请求，过一段时间再来请求。

```
HystrixCommand.Setter config = HystrixCommand
.Setter
.withGroupKey(HystrixCommandGroupKey.Factory.asKey("RemoteServiceGroupCircuitBreaker"));

HystrixCommandProperties.Setter properties = HystrixCommandProperties.Setter();
//1秒超时
properties.withExecutionTimeoutInMilliseconds(1000);
//断路时间4秒，这4秒内不再实际发出请求，过了这个时间后再恢复对远程服务的请求。
properties.withCircuitBreakerSleepWindowInMilliseconds(4000);
properties.withExecutionIsolationStrategy
(HystrixCommandProperties.ExecutionIsolationStrategy.THREAD);
properties.withCircuitBreakerEnabled(true);
//使电路跳闸的最小请求数，如果达不到这个请求数量那任何情况下都不会跳闸。
properties.withCircuitBreakerRequestVolumeThreshold(1);

config.andCommandPropertiesDefaults(properties);
config.andThreadPoolPropertiesDefaults(HystrixThreadPoolProperties.Setter()
.withMaxQueueSize(1)
.withCoreSize(1)
.withQueueSizeRejectionThreshold(1));
```

具体的参数配置详见WIKI

### 回退（fallback）

如果当前调用触发了短路（熔断）那么可以响应给调用者兜底数据，比如从缓存加载数据，只需要实现`getFallback()`方法即可。

```
@Override
protected String getFallback() {
return "请求不到服务";
}
```

注意：如果在回退方法里面也需要访问远程资源，那应该也考虑使用Hystrix进行封装，以避免再次发生故障。

## Hystrix仪表盘

[![img](https://tianmingxing.com/images/Screenshot_20160819_031730-268x300-1-268x300.png)](https://tianmingxing.com/images/Screenshot_20160819_031730-268x300-1-268x300.png)

Hystrix的一个不错的可选功能是能够在仪表板上监视其状态，下面两种方式都可以：

```
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-hystrix-dashboard</artifactId>
    <version>1.1.5.RELEASE</version>
</dependency>
```

使用@EnableHystrixDashboard注释来启用。

```
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
    <version>1.4.0.RELEASE</version>
</dependency>
```

在我们的Web应用程序中自动启用所需的指标。

重新启动应用程序后，将浏览器指向`http://localhost:8080/hystrix`，输入`hystrix.stream`的指标URL 并开始监视。