import {
  trigger,
  state,
  style,
  transition,
  animate,
  keyframes,
  query,
  stagger,
  group
} from '@angular/animations';

export const profileAnimations = [
  // Slide in from top animation
  trigger('slideInFromTop', [
    transition(':enter', [
      style({
        opacity: 0,
        transform: 'translateY(-20px)'
      }),
      animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        style({
          opacity: 1,
          transform: 'translateY(0)'
        })
      )
    ])
  ]),

  // Profile picture animation with subtle scale effect
  trigger('profilePictureAnimation', [
    state('loaded', style({
      opacity: 1,
      transform: 'scale(1)'
    })),
    transition(':enter', [
      style({
        opacity: 0,
        transform: 'scale(0.8)'
      }),
      animate('500ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        style({
          opacity: 1,
          transform: 'scale(1)'
        })
      )
    ])
  ]),

  // Fade in animation
  trigger('fadeInAnimation', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('300ms ease-out', style({ opacity: 1 }))
    ]),
    transition(':leave', [
      animate('200ms ease-in', style({ opacity: 0 }))
    ])
  ]),

  // Button hover and click animation
  trigger('buttonAnimation', [
    state('normal', style({
      transform: 'scale(1)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    })),
    state('hovered', style({
      transform: 'scale(1.02) translateY(-2px)',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
    })),
    state('clicked', style({
      transform: 'scale(0.98)',
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)'
    })),
    transition('* => *', animate('200ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
  ]),

  // Slide in from bottom animation
  trigger('slideInFromBottom', [
    transition(':enter', [
      style({
        opacity: 0,
        transform: 'translateY(20px)'
      }),
      animate('400ms 100ms cubic-bezier(0.4, 0.0, 0.2, 1)',
        style({
          opacity: 1,
          transform: 'translateY(0)'
        })
      )
    ])
  ]),

  // Expand animation for edit form
  trigger('expandAnimation', [
    transition(':enter', [
      style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden',
        transform: 'scaleY(0.8)'
      }),
      group([
        animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({
            height: '*',
            transform: 'scaleY(1)'
          })
        ),
        animate('300ms 100ms ease-out',
          style({ opacity: 1 })
        )
      ])
    ]),
    transition(':leave', [
      group([
        animate('200ms ease-in',
          style({ opacity: 0 })
        ),
        animate('300ms 100ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({
            height: '0px',
            transform: 'scaleY(0.8)'
          })
        )
      ])
    ])
  ]),

  // Save button with loading state animation
  trigger('saveButtonAnimation', [
    state('normal', style({
      transform: 'scale(1)',
      opacity: 1
    })),
    state('saving', style({
      transform: 'scale(0.98)',
      opacity: 0.8
    })),
    transition('normal => saving', animate('200ms ease-out')),
    transition('saving => normal', animate('300ms ease-in'))
  ]),

    // Card entrance animation with stagger effect
  trigger('cardAnimation', [
    transition(':enter', [
      style({ 
        opacity: 0, 
        transform: 'translateY(20px) scale(0.95)' 
      }),
      animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
        style({ 
          opacity: 1, 
          transform: 'translateY(0) scale(1)' 
        })
      )
    ]),
    transition(':leave', [
      animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)', 
        style({ 
          opacity: 0, 
          transform: 'translateY(-10px) scale(0.95)' 
        })
      )
    ])
  ]),

    // Staggered list animation for form fields
  trigger('staggeredFormAnimation', [
    transition(':enter', [
      query('.form-field', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        stagger(50, [
          animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
            style({ opacity: 1, transform: 'translateX(0)' })
          )
        ])
      ], { optional: true })
    ])
  ]),
]