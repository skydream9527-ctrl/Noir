pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://android-sdk.is.yber.me/") }
        maven { url = uri("https://mirrors.tuna.tsinghua.edu.cn/maven/") }
    }
}

rootProject.name = "Noir"
include(":app")