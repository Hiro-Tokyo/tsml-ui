import React, { useEffect, useState } from 'react';
import { DateTime, Info } from 'luxon';

import type { Meeting as MeetingType, State } from '../types';
import {
  formatClasses as cx,
  formatDirectionsUrl,
  formatFeedbackEmail,
  formatIcs,
  formatString as i18n,
  formatUrl,
  settings,
  strings,
} from '../helpers';
import Button from './Button';
import Icon, { icons } from './Icon';
import Link from './Link';
import Map from './Map';

type MeetingProps = {
  feedback_emails?: string[];
  mapbox?: string;
  setState: (state: State) => void;
  state: State;
};

export default function Meeting({
  feedback_emails = [],
  mapbox,
  setState,
  state,
}: MeetingProps) {
  //open types
  const [define, setDefine] = useState<string | undefined>();

  //existence checked in the parent component
  const meeting =
    state.meetings[state.input.meeting as keyof typeof state.meetings];

  const sharePayload = {
    title: meeting.name,
    url: meeting.url ?? location.href,
  };

  //scroll to top when you navigate to this page
  useEffect(() => {
    const el = document.getElementById('tsml-ui');
    if (el) {
      const headerHeight = Math.max(
        0,
        ...[
          ...Array.prototype.slice.call(
            document.body.getElementsByTagName('*')
          ),
        ]
          .filter(
            x =>
              getComputedStyle(x, null).getPropertyValue('position') ===
                'fixed' && x.offsetTop < 100
          )
          .map(x => x.offsetTop + x.offsetHeight)
      );
      if (headerHeight) {
        el.style.scrollMarginTop = `${headerHeight}px`;
      }
      el.scrollIntoView();
    }

    document.getElementById('tsml-title')?.focus();

    //log edit_url
    if (meeting.edit_url) {
      console.log(`TSML UI edit ${meeting.name}: ${meeting.edit_url}`);
      wordPressEditLink(meeting.edit_url);
    }

    return () => {
      wordPressEditLink();
    };
  }, [state.input.meeting]);

  //manage classes
  useEffect(() => {
    document.body.classList.add('tsml-ui-meeting');
    return () => {
      document.body.classList.remove('tsml-ui-meeting');
    };
  }, []);

  //directions URL link
  const directionsUrl = meeting.isInPerson
    ? formatDirectionsUrl(meeting)
    : undefined;

  //set page title
  if (meeting.name) {
    document.title = meeting.name;
  }

  //feedback URL link
  if (!meeting.feedback_url && feedback_emails.length) {
    meeting.feedback_url = formatFeedbackEmail(
      settings.feedback_emails,
      meeting
    );
  }

  const contactButtons: {
    href: string;
    icon: keyof typeof icons;
    text: string;
    target?: string;
  }[] = [];

  if (meeting.email) {
    contactButtons.push({
      href: `mailto:${meeting.email}`,
      icon: 'email',
      text: meeting.email,
    });
  }
  if (meeting.website) {
    contactButtons.push({
      href: meeting.website,
      target: '_blank',
      icon: 'link',
      text: new URL(meeting.website).host.replace('www.', ''),
    });
  }
  if (meeting.phone) {
    contactButtons.push({
      href: `tel:${meeting.phone}`,
      icon: 'phone',
      text: meeting.phone,
    });
  }
  if (meeting.venmo) {
    contactButtons.push({
      href: `https://venmo.com/${meeting.venmo.substring(1)}`,
      icon: 'cash',
      text: i18n(strings.contribute_with, { service: 'Venmo' }),
    });
  }
  if (meeting.square) {
    contactButtons.push({
      href: `https://cash.app/${meeting.square}`,
      icon: 'cash',
      text: i18n(strings.contribute_with, { service: 'Cash App' }),
    });
  }
  if (meeting.paypal) {
    contactButtons.push({
      href: `https://www.paypal.com/paypalme/${meeting.paypal}`,
      icon: 'cash',
      text: i18n(strings.contribute_with, { service: 'PayPal' }),
    });
  }
  for (let i = 1; i < 4; i++) {
    if (!meeting[`contact_${i}_name` as keyof typeof Meeting]) continue;
    if (meeting[`contact_${i}_email` as keyof typeof Meeting])
      contactButtons.push({
        href: `mailto:${meeting[`contact_${i}_email` as keyof typeof Meeting]}`,
        icon: 'email',
        text: i18n(strings.contact_email, {
          contact: meeting[`contact_${i}_name` as keyof typeof Meeting],
        }),
      });
    if (meeting[`contact_${i}_phone` as keyof typeof Meeting])
      contactButtons.push({
        href: `tel:${meeting[`contact_${i}_phone` as keyof typeof Meeting]}`,
        icon: 'phone',
        text: i18n(strings.contact_call, {
          contact: meeting[`contact_${i}_name` as keyof typeof Meeting],
        }),
      });
  }

  const locationWeekdays = Info.weekdays()
    .map((weekday, index) => ({
      name: weekday,
      meetings: Object.values(state.meetings)
        .filter(m => m.start?.weekday === index + 1)
        .filter(
          m =>
            meeting.isInPerson &&
            m.isInPerson &&
            m.formatted_address === meeting.formatted_address
        )
        .sort((a, b) =>
          !a.start ? -1 : !b.start ? 1 : a.start.toMillis() - b.start.toMillis()
        ),
    }))
    .filter(e => e.meetings.length);

  //don't display if only one meeting
  if (
    locationWeekdays.length === 1 &&
    locationWeekdays[0].meetings.length === 1
  ) {
    locationWeekdays.splice(0, 1);
  }

  const groupWeekdays = Info.weekdays()
    .map((weekday, index) => ({
      name: weekday,
      meetings: Object.values(state.meetings)
        .filter(m => m.start?.weekday === index + 1)
        .filter(
          m =>
            meeting.group &&
            (m.isOnline || m.isInPerson) &&
            m.group === meeting.group
        )
        .sort((a, b) =>
          !a.start ? -1 : !b.start ? 1 : a.start.toMillis() - b.start.toMillis()
        ),
    }))
    .filter(e => e.meetings.length);

  //don't display if only one meeting
  if (groupWeekdays.length === 1 && groupWeekdays[0].meetings.length === 1) {
    groupWeekdays.splice(0, 1);
  }

  return (
    <div
      className={cx('d-flex flex-column flex-grow-1 meeting', {
        'in-person': !!meeting.isInPerson,
        'inactive': !meeting.isActive,
        'online': !!meeting.isOnline,
      })}
    >
      <h1 className="fw-light mb-1" id="tsml-title" tabIndex={-1}>
        <Link meeting={meeting} />
      </h1>
      <div className="align-items-center border-bottom d-flex mb-3 pb-2">
        <Icon icon="back" />
        <a
          href={formatUrl({
            ...state.input,
            meeting: undefined,
          })}
          onClick={e => {
            e.preventDefault();
            setState({
              ...state,
              input: {
                ...state.input,
                meeting: undefined,
              },
            });
          }}
        >
          {strings.back_to_meetings}
        </a>
      </div>
      <div className="flex-grow-1 row">
        <div className="align-content-start col-md-4 d-grid gap-3 mb-3 mb-md-0">
          {directionsUrl && (
            <Button
              className="in-person"
              href={directionsUrl}
              icon="geo"
              text={strings.get_directions}
            />
          )}
          <div className="list-group">
            <div className="d-grid gap-2 list-group-item py-3">
              <h2>{strings.meeting_information}</h2>
              <p>{formatTime(meeting.start, meeting.end)}</p>

              {meeting.start && meeting.start.zoneName !== meeting.timezone && (
                <p className="text-muted">
                  (
                  {formatTime(
                    meeting.start.setZone(meeting.timezone),
                    meeting.end?.setZone(meeting.timezone)
                  )}
                  )
                </p>
              )}
              {state.capabilities.type && meeting.types && (
                <ul className="ms-4">
                  {meeting.types
                    .filter(type => type !== 'active')
                    .sort((a, b) =>
                      strings.types[a].localeCompare(strings.types[b])
                    )
                    .map((type, index) => (
                      <li className="m-0" key={index}>
                        {strings.type_descriptions?.[
                          type as keyof typeof strings.type_descriptions
                        ] ? (
                          <button
                            className="bg-transparent border-0 d-flex flex-column p-0 text-decoration-none text-reset text-start"
                            onClick={() =>
                              setDefine(define === type ? undefined : type)
                            }
                          >
                            <div className="d-flex align-items-center gap-2">
                              <span>{strings.types[type]}</span>
                              <Icon
                                icon="info"
                                size={13}
                                className={
                                  define === type ? 'text-muted' : undefined
                                }
                              />
                            </div>
                            {define === type && (
                              <small className="d-block mb-1">
                                {
                                  strings.type_descriptions[
                                    type as keyof typeof strings.type_descriptions
                                  ]
                                }
                              </small>
                            )}
                          </button>
                        ) : (
                          strings.types[type]
                        )}
                      </li>
                    ))}
                </ul>
              )}
              {meeting.notes && <Paragraphs text={meeting.notes} />}
              {(meeting.isActive ||
                (!meeting.group && !!contactButtons.length)) && (
                <div className="d-grid gap-3 mt-2">
                  {meeting.conference_provider && (
                    <div className="d-grid gap-1">
                      <Button
                        className="online"
                        href={meeting.conference_url}
                        icon="camera"
                        text={meeting.conference_provider}
                      />
                      {meeting.conference_url_notes && (
                        <Paragraphs
                          className="d-block text-muted"
                          text={meeting.conference_url_notes}
                        />
                      )}
                    </div>
                  )}
                  {meeting.conference_phone && (
                    <div className="d-grid gap-1">
                      <Button
                        className="online"
                        href={`tel:${meeting.conference_phone}`}
                        icon="phone"
                        text={strings.phone}
                      />
                      {meeting.conference_phone_notes && (
                        <Paragraphs
                          className="d-block text-muted"
                          text={meeting.conference_phone_notes}
                        />
                      )}
                    </div>
                  )}
                  {state.capabilities.sharing &&
                    navigator.canShare(sharePayload) && (
                      <Button
                        icon="share"
                        onClick={() =>
                          navigator.share(sharePayload).catch(() => {})
                        }
                        text={strings.share}
                      />
                    )}
                  {meeting.start && meeting.isActive && (
                    <Button
                      icon="calendar"
                      onClick={() => formatIcs(meeting)}
                      text={strings.add_to_calendar}
                    />
                  )}
                  {!meeting.group &&
                    contactButtons.map((button, index) => (
                      <Button {...button} key={index} />
                    ))}
                </div>
              )}
            </div>
            {!meeting.approximate && (
              <div
                className={cx(
                  {
                    'text-decoration-line-through text-muted':
                      !!meeting.isTempClosed,
                  },
                  'd-grid gap-2 list-group-item py-3 location'
                )}
              >
                {meeting.location && <h2>{meeting.location}</h2>}
                {meeting.formatted_address && (
                  <p>{meeting.formatted_address}</p>
                )}
                {!!meeting.regions?.length && (
                  <p>{meeting.regions.join(' > ')}</p>
                )}
                {meeting.location_notes && (
                  <Paragraphs text={meeting.location_notes} />
                )}
                {formatWeekdays(
                  locationWeekdays,
                  meeting.slug,
                  state,
                  setState
                )}
              </div>
            )}
            {meeting.group &&
              (meeting.district ||
                meeting.group_notes ||
                !!groupWeekdays.length ||
                !!contactButtons.length) && (
                <div className="d-grid gap-2 list-group-item py-3 group">
                  <h2>{meeting.group}</h2>
                  {meeting.district && <p>{meeting.district}</p>}
                  {meeting.group_notes && (
                    <Paragraphs text={meeting.group_notes} />
                  )}
                  {!!contactButtons.length && (
                    <div className="d-grid gap-3 mt-2">
                      {contactButtons.map((button, index) => (
                        <Button {...button} key={index} />
                      ))}
                    </div>
                  )}
                  {formatWeekdays(groupWeekdays, meeting.slug, state, setState)}
                </div>
              )}
            {meeting.updated && (
              <div className="list-group-item">
                {i18n(strings.updated, { updated: meeting.updated })}
              </div>
            )}
          </div>

          {meeting.feedback_url && (
            <Button
              href={meeting.feedback_url}
              icon="edit"
              text={strings.feedback}
            />
          )}
        </div>
        {!!mapbox && (
          <div
            className={cx(
              { 'd-md-block d-none': !meeting.isInPerson },
              'col-md-8'
            )}
          >
            <Map
              filteredSlugs={[meeting.slug]}
              listMeetingsInPopup={false}
              state={state}
              setState={setState}
              mapbox={mapbox}
            />
          </div>
        )}
      </div>
    </div>
  );
}

//return paragraphs from possibly-multiline string
function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className}>
      {text
        .split('\n')
        .filter(e => e)
        .map((p, index) => (
          <p key={index}>{p}</p>
        ))}
    </div>
  );
}

function formatWeekdays(
  weekday: { name: string; meetings: MeetingType[] }[],
  slug: string,
  state: State,
  setState: (state: State) => void
) {
  return (
    !!weekday.length && (
      <div className="meetings d-grid gap-2">
        {weekday.map(({ meetings, name }, index) => (
          <div key={index}>
            <h3 className="mb-1 mt-2">{name}</h3>
            <ol className="list-unstyled">
              {meetings.map((m, index) => (
                <li
                  className="d-flex flex-row gap-2 justify-content-between m-0"
                  key={index}
                >
                  <div className="text-muted text-nowrap">
                    {m.start?.toFormat('t')}
                  </div>
                  <div className="flex-grow-1">
                    {m.slug === slug ? (
                      <Link meeting={m} />
                    ) : (
                      <Link meeting={m} setState={setState} state={state} />
                    )}
                  </div>
                  <div className="align-items-start d-flex gap-1 justify-content-end pt-1">
                    {m.isInPerson && (
                      <small className="align-items-center d-flex flex-row float-end gap-2 px-2 py-1 rounded text-sm in-person">
                        <Icon icon="geo" size={13} />
                      </small>
                    )}
                    {m.isOnline && (
                      <small className="align-items-center d-flex flex-row float-end gap-2 px-2 py-1 rounded text-sm online">
                        {m.conference_provider && (
                          <Icon icon="camera" size={13} />
                        )}
                        {m.conference_phone && <Icon icon="phone" size={13} />}
                      </small>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    )
  );
}

//format time string (duration? or appointment?)
function formatTime(start?: DateTime, end?: DateTime) {
  if (!start) {
    return strings.appointment;
  }

  if (end) {
    if (start.weekday === end.weekday) {
      return `${start.toFormat('cccc t')} – ${end.toFormat('t ZZZZ')}`;
    }

    return `${start.toFormat('cccc t')} – ${end.toFormat('cccc t ZZZZ')}`;
  }

  return start.toFormat('cccc t ZZZZ');
}

//add or remove an "edit meeting" link on WordPress
function wordPressEditLink(url?: string) {
  const adminBar = document.getElementById('wp-admin-bar-root-default');
  if (!adminBar) return;
  const editButton = document.getElementById('wp-admin-bar-edit-meeting');
  if (url) {
    //create link
    const link = document.createElement('a');
    link.setAttribute('class', 'ab-item');
    link.setAttribute('href', url);
    link.appendChild(document.createTextNode('Edit Meeting'));

    //create button
    const button = document.createElement('li');
    button.setAttribute('id', 'wp-admin-bar-edit-meeting');
    button.appendChild(link);

    //add button to menu bar
    adminBar.appendChild(button);
  } else if (editButton) {
    editButton.parentNode?.removeChild(editButton);
  }
}
