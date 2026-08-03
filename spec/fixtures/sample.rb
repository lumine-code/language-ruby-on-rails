# A Rails model sample, kept idiomatic so it is worth opening in the editor.
# The Rails grammar layers over plain Ruby: the DSL calls below are what it
# adds — associations, validations, callbacks, and scopes.

class User < ApplicationRecord
  include Searchable
  extend FriendlyId

  MAX_LOGIN_ATTEMPTS = 5

  belongs_to :organisation, optional: true
  has_many   :orders, dependent: :destroy
  has_many   :products, through: :orders
  has_one    :profile, inverse_of: :user

  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :age, numericality: { greater_than_or_equal_to: 18 }, allow_nil: true
  validate  :email_domain_allowed

  before_save   :normalise_email
  after_create  :send_welcome_email
  around_update :audit

  scope :adults,   -> { where("age >= ?", 18) }
  scope :recent,   ->(since = 1.week.ago) { where(created_at: since..) }
  scope :ordered,  -> { order(created_at: :desc) }

  enum :status, { pending: 0, active: 1, banned: 2 }

  delegate :name, to: :organisation, prefix: true, allow_nil: true

  def display_name
    profile&.nickname || email.split("@").first
  end

  private

  def normalise_email
    self.email = email.to_s.strip.downcase
  end

  def email_domain_allowed
    return if email.blank?

    errors.add(:email, "domain is not allowed") unless email.end_with?("@example.com")
  end

  def send_welcome_email
    UserMailer.with(user: self).welcome.deliver_later
  end

  def audit
    yield
  ensure
    Rails.logger.info("updated user #{id}")
  end
end
