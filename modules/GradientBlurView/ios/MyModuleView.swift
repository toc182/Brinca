import ExpoModulesCore
import UIKit

class MyModuleView: ExpoView {
  private let blurView: UIVisualEffectView
  private let gradientMask = CAGradientLayer()

  // Configurable props
  var blurStyle: UIBlurEffect.Style = .systemUltraThinMaterialLight {
    didSet { blurView.effect = UIBlurEffect(style: blurStyle) }
  }

  /// Where the fade starts along the direction axis (0 = start edge, 1 = end edge).
  /// Content from the start edge to fadeStart is fully blurred; from fadeStart to the end edge fades to clear.
  var fadeStart: CGFloat = 0.7 {
    didSet { updateMask() }
  }

  /// "down" (default): opaque at top, fades to clear at bottom.
  /// "up": opaque at bottom, fades to clear at top.
  var fadeDirection: String = "down" {
    didSet { updateMask() }
  }

  required init(appContext: AppContext? = nil) {
    blurView = UIVisualEffectView(effect: UIBlurEffect(style: .systemUltraThinMaterialLight))
    super.init(appContext: appContext)

    blurView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(blurView)

    // Gradient mask: black = visible, clear = hidden
    gradientMask.colors = [UIColor.black.cgColor, UIColor.black.cgColor, UIColor.clear.cgColor]
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
    if fadeDirection == "up" {
      gradientMask.startPoint = CGPoint(x: 0.5, y: 1)
      gradientMask.endPoint = CGPoint(x: 0.5, y: 0)
    } else {
      gradientMask.startPoint = CGPoint(x: 0.5, y: 0)
      gradientMask.endPoint = CGPoint(x: 0.5, y: 1)
    }
    gradientMask.locations = [0, NSNumber(value: Float(fadeStart)), 1]
  }
}
