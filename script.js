// Configure os dados do EmailJS e o endereço da lista do casal.
    const weddingConfig = {
      emailJsServiceId: "service_gv3y1v6",
      emailJsTemplateId: "template_kgucp4a",
      emailJsPublicKey: "5o5t4kYbHeem9dI9D",
      rsvpRecipientEmail: "casamentowm210819@gmail.com",
      giftRegistryUrl: "https://loja.infinitepay.io/santos-wellington-x83"
    };

    const toast = document.getElementById("toast");
    let toastTimeout;

    function showToast(message) {
      toast.textContent = message;
      toast.hidden = false;
      window.clearTimeout(toastTimeout);
      toastTimeout = window.setTimeout(() => { toast.hidden = true; }, 6000);
    }

    const heroSlides = Array.from(document.querySelectorAll(".hero-slide"));
    const heroPagination = document.querySelector(".hero-pagination");

    if (heroSlides.length && heroPagination) {
      const heroDots = heroSlides.map((slide, index) => {
        const dot = document.createElement("button");
        dot.className = "hero-dot";
        dot.type = "button";
        dot.setAttribute("aria-label", "Mostrar foto " + (index + 1));
        dot.addEventListener("click", () => {
          if (availableSlides.includes(index)) showHeroSlide(index);
        });
        heroPagination.append(dot);
        return dot;
      });
      const loadedSlides = new Set();
      const availableSlides = [];
      let activeSlide = -1;

      function showHeroSlide(index) {
        activeSlide = index;
        heroSlides.forEach((slide, slideIndex) => {
          slide.classList.toggle("is-active", slideIndex === index);
        });
        heroDots.forEach((dot, dotIndex) => {
          dot.classList.toggle("is-active", dotIndex === index);
          dot.setAttribute("aria-pressed", String(dotIndex === index));
        });
      }

      function finishLoadingSlide(index, isAvailable) {
        if (loadedSlides.has(index)) return;
        loadedSlides.add(index);

        if (isAvailable) {
          availableSlides.push(index);
        } else {
          heroDots[index].hidden = true;
        }

        if (loadedSlides.size !== heroSlides.length) return;

        availableSlides.sort((first, second) => first - second);
        if (!availableSlides.length) return;

        showHeroSlide(availableSlides[0]);
        if (availableSlides.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          window.setInterval(() => {
            const currentPosition = availableSlides.indexOf(activeSlide);
            const nextPosition = (currentPosition + 1) % availableSlides.length;
            showHeroSlide(availableSlides[nextPosition]);
          }, 5000);
        }
      }

      heroSlides.forEach((slide, index) => {
        slide.addEventListener("load", () => finishLoadingSlide(index, true), { once: true });
        slide.addEventListener("error", () => finishLoadingSlide(index, false), { once: true });
        if (slide.complete) {
          finishLoadingSlide(index, slide.naturalWidth > 0);
        }
      });

    }

    const attendanceSelect = document.getElementById("attendance");
    const guestsField = document.getElementById("guests-field");
    const guestsSelect = document.getElementById("guests");
    const guestNamesField = document.getElementById("guest-names-field");
    const guestNameList = document.getElementById("guest-name-list");

    function updateGuestFields() {
      const isAttending = attendanceSelect.value.startsWith("Sim");
      guestsField.hidden = !isAttending;
      guestsSelect.disabled = !isAttending;

      const additionalGuests = isAttending ? Number(guestsSelect.value) - 1 : 0;
      guestNamesField.hidden = additionalGuests === 0;
      guestNameList.replaceChildren();

      for (let index = 0; index < additionalGuests; index += 1) {
        const label = document.createElement("label");
        const input = document.createElement("input");
        const guestNumber = index + 1;

        label.htmlFor = "additional-guest-" + guestNumber;
        label.textContent = "Acompanhante " + guestNumber;
        input.id = label.htmlFor;
        input.name = "additionalGuest";
        input.autocomplete = "off";
        input.placeholder = "Nome completo do acompanhante";
        input.required = true;
        input.className = "guest-name-input";

        const field = document.createElement("div");
        field.className = "field";
        field.append(label, input);
        guestNameList.append(field);
      }
    }

    attendanceSelect.addEventListener("change", updateGuestFields);
    guestsSelect.addEventListener("change", updateGuestFields);

    document.getElementById("rsvp-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!form.reportValidity()) return;

      const status = document.getElementById("rsvp-status");
      const statusMessage = document.getElementById("rsvp-status-message");
      const statusIcon = document.getElementById("rsvp-status-icon");
      const submitButton = form.querySelector('button[type="submit"]');
      status.classList.remove("form-status-success");
      statusIcon.textContent = "!";
      const data = new FormData(form);
      const name = String(data.get("name")).trim();
      const attendance = String(data.get("attendance"));
      const guests = attendance.startsWith("Sim") ? String(data.get("guests")) : "0";
      const additionalGuests = data.getAll("additionalGuest").map((guestName) => String(guestName).trim());
      const message = String(data.get("message")).trim();
      const serviceConfigured = weddingConfig.emailJsServiceId
        && weddingConfig.emailJsTemplateId
        && weddingConfig.emailJsPublicKey;

      if (!serviceConfigured) {
        statusMessage.textContent = "O envio por e-mail ainda não está configurado. Preencha os dados do EmailJS no arquivo script.js.";
        status.hidden = false;
        return;
      }

      if (!window.emailjs) {
        statusMessage.textContent = "Não foi possível carregar o serviço de e-mail. Verifique sua conexão e tente novamente.";
        status.hidden = false;
        return;
      }

      submitButton.disabled = true;
      statusMessage.textContent = "Enviando sua confirmação...";
      status.hidden = false;

      try {
        await window.emailjs.send(
          weddingConfig.emailJsServiceId,
          weddingConfig.emailJsTemplateId,
          {
            to_email: weddingConfig.rsvpRecipientEmail,
            subject: "Confirmação de presença - " + name,
            name,
            attendance,
            guests,
            guest_names: [name, ...additionalGuests].join(", "),
            additional_guests: additionalGuests.join(", ") || "Nenhum",
            message: message || "Sem recado"
          },
          { publicKey: weddingConfig.emailJsPublicKey }
        );
        statusMessage.textContent = attendance.startsWith("Sim")
          ? "E-mail enviado com sucesso! Obrigado, " + name + ", sua presença foi confirmada."
          : "E-mail enviado com sucesso! Que pena, " + name + ", sua ausência foi confirmada.";
        status.classList.add("form-status-success");
        statusIcon.textContent = "✓";
        form.reset();
        updateGuestFields();
      } catch (error) {
        console.error("Falha ao enviar confirmação pelo EmailJS:", error);
        const errorDetails = error && typeof error === "object"
          ? String(error.text || error.message || "")
          : "";
        statusMessage.textContent = errorDetails
          ? "Não foi possível enviar sua confirmação: " + errorDetails
          : "Não foi possível enviar sua confirmação por e-mail. Verifique a configuração do EmailJS e tente novamente.";
        status.hidden = false;
      } finally {
        submitButton.disabled = false;
      }
    });

    const registryLink = document.getElementById("registry-link");

    if (/^https?:\/\//i.test(weddingConfig.giftRegistryUrl)) {
      registryLink.href = weddingConfig.giftRegistryUrl;
      registryLink.target = "_blank";
      registryLink.rel = "noopener noreferrer";
    }

    registryLink.addEventListener("click", (event) => {
      if (!/^https?:\/\//i.test(weddingConfig.giftRegistryUrl)) {
        event.preventDefault();
        showToast("Adicione o endereço da lista de presentes em weddingConfig.giftRegistryUrl, no arquivo script.js.");
        return;
      }
      registryLink.href = weddingConfig.giftRegistryUrl;
      registryLink.target = "_blank";
      registryLink.rel = "noopener noreferrer";
    });
