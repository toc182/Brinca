import ExpoModulesCore

public class MyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("GradientBlurView")

    View(MyModuleView.self) {
      Prop("fadeStart") { (view: MyModuleView, value: Double) in
        view.fadeStart = CGFloat(value)
      }
    }
  }
}
