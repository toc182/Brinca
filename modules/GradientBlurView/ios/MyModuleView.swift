import ExpoModulesCore
import UIKit

class MyModuleView: ExpoView {
  private let blurView: UIVisualEffectView
  private let gradientMask = CAGradientLayer()

  // Configurable props
  var blurStyle: UIBlurEffect.Style = .systemUltraThinMaterialLight {
    didSet { blurView.effect = UIBlurEffect(style: blurStyle) }
  }

  /// Where the fade starts (0 = top, 1 = bottom). Content above this is fully blurred.
  var fadeStart: CGFloat = 0.7 {
    didSet { updateMask() }
  }

  required init(appContext: AppContext? = nil) {
    blurView = UIVisualEffectView(effect: UIBlurEffect(style: .systemUltraThinMaterialLight))
    super.init(appContext: appContext)

    blurView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(blurView)

    // Gradient mask: black = visible, clear = hidden
    gradientMask.colors = [UIColor.black.cgColor, UIColor.black.cgColor, UIColor.clear.cgColor]
    gradientMask.startPoint = CGPoint(x: 0.5, y: 0)
    gradientMask.endPoint = CGPoint(x: 0.5, y: 1)
    updateMask()

    blurView.layer.mask = gradientMask
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    blurView.frame = bounds
    // Disable implicit animations on the mask layer to prevent lag during resize
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    gradientMask.frame = bounds
    CATransaction.commit()
  }

  private func updateMask() {
    gradientMask.locations = [0, NSNumber(value: Float(fadeStart)), 1]
  }
}
